const Collection = require('../models/collection');
const NFT = require('../models/nft');
const { verifyToken } = require('../services/tokenServices');
const BuyingHistory = require('../models/buyhistory');
require('dotenv').config();
const { pinata } = require('../services/pinataServices');
const { uploadToCloudinary } = require('../services/cloudinaryServices');
const { Blob } = require('buffer');


// // Create a new NFT
const createNFT = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }
        const walletAddress = verification.data.data.walletAddress;

        // Ensure a single file is uploaded
        if (!req.file) {
            return res.status(400).json({ status: false, message: "NFT image is required" });
        }

        // Upload image to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, { folder: "Storage" });
        if (!cloudinaryResult?.secure_url) {
            throw new Error("Failed to upload image to Cloudinary");
        }
        const imageUrl = cloudinaryResult.secure_url;
        // console.log(imageUrl, "image url");


        const { name, description, collectionId, contractAddress, transactionHash } = req.body;
        if (!(name && description && collectionId && contractAddress && transactionHash)) {
            return res.status(400).json({ status: false, message: "All fields are required" });
        }

        const findCollection = await Collection.findOne({ collectionId });
        if (!findCollection) {
            return res.status(404).json({ status: false, message: "Collection not found" });
        }

        const checkTrx = await NFT.findOne({ transactionHash });
        if (checkTrx) {
            return res.status(400).json({ status: false, message: "Transaction hash already exists" });
        }

        // Generate tokenId
        const sellCount = await NFT.countDocuments();
        const id = sellCount + 1;

        const metadata = {
            tokenId: id,
            name,
            description,
            collectionName: findCollection.collectionName,
            contractAddress,
            transactionHash,
        };

        // // Upload image to Pinata
        const fileBuffer = req.file.buffer; // Use buffer directly
        // const imageResult = await pinata.upload.file(fileBuffer, {
        //     metadata: { name: `${name}-image` }
        // });

        // if (!imageResult?.IpfsHash) {
        //     throw new Error("Failed to get CID from image upload");
        // }
        // metadata.image = `ipfs://${imageResult.IpfsHash}`;

        // // Upload metadata to Pinata
        // const metadataResult = await pinata.upload.json(metadata, {
        //     metadata: { name: `${name}-metadata` }
        // });

        // if (!metadataResult?.IpfsHash) {
        //     throw new Error("Failed to get CID from metadata upload");
        // }

        // Upload image to Pinata
        const fileBlob = new Blob([fileBuffer], { type: req.file.mimetype });
        const imageResult = await pinata.upload.file(fileBlob, {
            metadata: { name: `${name}-image` }
        });

        if (!imageResult?.IpfsHash) {
            throw new Error("Failed to get CID from image upload");
        }
        metadata.image = `ipfs://${imageResult.IpfsHash}`;

        // Upload metadata to Pinata
        const metadataResult = await pinata.upload.json(metadata, {
            metadata: { name: `${name}-metadata` }
        });

        if (!metadataResult?.IpfsHash) {
            throw new Error("Failed to get CID from metadata upload");
        }
        // Create gateway URLs
        const pinataGateway = process.env.PINATA_GATEWAY;
        if (!pinataGateway) {
            throw new Error("PINATA_GATEWAY is not defined in environment variables");
        }

        const metadataGatewayURL = `${pinataGateway}/ipfs/${metadataResult.IpfsHash}`;
        const imageGatewayURL = `${pinataGateway}/ipfs/${imageResult.IpfsHash}`;

        // Save NFT to DB
        const nft = new NFT({
            tokenId: id,
            collectionId,
            walletAddress,
            name,
            description,
            collectionName: findCollection.collectionName,
            transactionHash,
            contractAddress,
            imageUrl, // Cloudinary URL
            metadataURL: metadataGatewayURL,
            ipfsImageUrl: imageGatewayURL,
        });

        await nft.save();
        return res.status(201).json({ status: true, message: "NFT created successfully", nft });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


const getNFTs = async (req, res) => {
    try {
        const nfts = await NFT.find({}).sort({ _id: -1 });
        return res.status(200).json({ status: true, message: "Get all nft's", data: nfts });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const getNftById = async (req, res) => {
    try {
        const { tokenId } = req.params;
        const nft = await NFT.findOne({ tokenId });
        if (!nft) {
            return res.status(404).json({ status: false, message: "NFT not found" });
        }
        return res.status(200).json({ status: true, message: "Get nft by id", data: nft });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const buyNFT = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message })
        }
        const walletAddress = verification.data.data.walletAddress;
        const { tokenId, isMinted, transactionHash } = req.body;

        if (!(tokenId && isMinted && transactionHash)) {
            return res.status(400).json({ status: false, message: "All fields are required" })
        }

        const updateNFT = await NFT.updateOne({ tokenId },
            {
                $set: {
                    isMinted,
                    isForSale: false,
                    buyerAddress: walletAddress,
                    transactionHash: transactionHash,
                    buyDate: Date.now()
                },
                $unset: { sellExpiry: 1 }
            },
        );
        if (!updateNFT) {
            return res.status(404).json({ status: false, message: "NFT not found" });
        }
        const nft = await NFT.findOne({ tokenId });

        const newObj = {
            tokenId: nft.tokenId,
            buyerAddress: walletAddress,
            buyDate: Date.now(),
            price: nft.price,
            sellerAddress: nft.walletAddress,
            contractAddress: nft.contractAddress,
            transactionHash: transactionHash
        }
        await BuyingHistory.create(newObj);
        return res.status(200).json({ status: true, message: "NFT bought successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


const listNFTForSale = async (req, res) => {
    try {
        const verification = await verifyToken(req);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }

        const walletAddress = verification.data.data.walletAddress;
        const { tokenId, price, sellExpiry } = req.body;

        // Validate input
        if (!(tokenId && price)) {
            return res.status(400).json({ status: false, message: 'All fields are required' });
        }
        if (price < 0) {
            return res.status(400).json({ status: false, message: 'Price cannot be negative' });
        }

        // Find the NFT
        const nft = await NFT.findOne({ tokenId });
        if (!nft) {
            return res.status(404).json({ status: false, message: 'NFT not found' });
        }

        // Verify ownership
        if (nft.walletAddress !== walletAddress) {
            return res.status(403).json({ status: false, message: 'You are not the owner of this NFT' });
        }

        if (nft.isForSale === true) {
            return res.status(400).json({ status: false, message: 'NFT is already listed for sale' });
        }

        // Update NFT for sale
        nft.price = price;
        nft.isForSale = true;
        // nft.sellExpiry = expiryDate;

        // Handle sellExpiry only if provided and valid
        if (sellExpiry) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + parseInt(sellExpiry));

            // Validate if expiry is in the future (optional, but good practice)
            if (expiryDate <= new Date()) {
                return res.status(400).json({ status: false, message: 'Sell expiry must be in the future' });
            }

            nft.sellExpiry = expiryDate;
        }

        await nft.save();

        return res.status(200).json({
            status: true,
            message: 'NFT listed for sale successfully',
            data: nft
        });
    } catch (error) {
        console.error('Error listing NFT for sale:', error);
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

const removeNFTFromSale = async (req, res) => {
    try {
        const verification = await verifyToken(req);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }

        const walletAddress = verification.data.data.walletAddress;
        const { tokenId } = req.body;

        if (!tokenId) {
            return res.status(400).json({ status: false, message: 'nftId is required' });
        }

        const nft = await NFT.findOne({ tokenId });
        if (!nft) {
            return res.status(404).json({ status: false, message: 'NFT not found' });
        }

        if (nft.walletAddress !== walletAddress) {
            return res.status(403).json({ status: false, message: 'You are not the owner of this NFT' });
        }

        if (!nft.isForSale) {
            return res.status(400).json({ status: false, message: 'NFT is not currently for sale' });
        }

        nft.isForSale = false;
        nft.price = undefined;
        nft.sellExpiry = undefined;
        await nft.save();

        return res.status(200).json({
            status: true,
            message: 'NFT removed from sale successfully',
            data: nft
        });
    } catch (error) {
        console.error('Error removing NFT from sale:', error);
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

module.exports = { createNFT, getNFTs, getNftById, buyNFT, listNFTForSale, removeNFTFromSale };