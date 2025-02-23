const Collection = require('../models/collection');
const NFT = require('../models/nft');
const { verifyToken } = require('../services/tokenServices');
const BuyingHistory = require('../models/buyhistory');
const fs = require('fs');
const ipfs = require('../services/infuraServices');
require('dotenv').config();


// Create a new NFT
const createNFT = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }
        const walletAddress = verification.data.data.walletAddress;

        let files = req.files;
        let imageUrl = [];
        if (files) {
            for (let file of files) {
                imageUrl.push(file.filename);
            }
        }
        const { name, description, collectionId, contractAddress, transactionHash } = req.body;

        if (!(name && description && collectionId && contractAddress && transactionHash)) {
            return res.status(400).json({ status: false, message: "All fields are required" });
        }

        // const checkTokenId = await NFT.findOne({ tokenId });
        // if (checkTokenId) {
        //     return res.status(400).json({ status: false, message: "Token Id already exists" });
        // }

        // Check if collection exists
        const findCollection = await Collection.findOne({ collectionId: collectionId });
        if (!findCollection) {
            return res.status(404).json({ status: false, message: "Collection not found" });
        }

        const checkTrx = await NFT.findOne({ transactionHash });
        if (checkTrx) {
            return res.status(400).json({ status: false, message: "Transaction hash already exist" })
        }

        // Create new nft entry with imageUrl
        const sellCount = await NFT.countDocuments();
        const id = sellCount + 1;

        const metadata = {
            tokenId: id,
            name,
            description,
            collectionName: findCollection.collectionName,
            contractAddress,
            transactionHash,
        }


        // const imageBuffer = await fs.promises.readFile(files[0].path);
        // console.log(imageBuffer.length, "imageBuffer");

        // // Upload metadata and image to IPFS
        // const imageResult = await ipfs.add(imageBuffer, { wrapWithDirectory: false });
        // console.log(imageResult, "imageResult");

        // // Store the image CID in the metadata
        // metadata.image = `ipfs://${imageResult[0].hash}`;

        // const metadataResult = await ipfs.add(Buffer.from(JSON.stringify(metadata)));
        // console.log(metadataResult, "metadataResult");


        // // Create gateway URLs for metadata and image
        // const metadataGatewayURL = `${process.env.INFURA_IPFS_ENDPOINT}/ipfs/${metadataResult[0].hash}`;
        // const imageGatewayURL = `${process.env.INFURA_IPFS_ENDPOINT}/ipfs/${imageResult[0].hash}`;

        const nft = new NFT({
            tokenId: id,
            collectionId,
            walletAddress: walletAddress,
            name,
            description,
            collectionName: findCollection.collectionName,
            transactionHash,
            contractAddress,
            // seller: walletAddress,
            imageUrl: imageUrl, // Include image URLs here
            // metadataURL: metadataGatewayURL,
            // ipfsImageUrl: imageGatewayURL,

        });

        await nft.save();
        return res.status(201).json({ status: true, message: "NFT created successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


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