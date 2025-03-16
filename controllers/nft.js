const Collection = require("../models/collection");
const NFT = require("../models/nft");
const { verifyToken } = require("../services/tokenServices");
const BuyingHistory = require("../models/buyhistory");
require("dotenv").config();
const { pinata } = require("../services/pinataServices");
const { uploadToCloudinary } = require("../services/cloudinaryServices");
const { Blob } = require("buffer");
const Category = require("../models/category");
const SELLNFT = require("../models/sell");
const { User } = require("../models/user");
const COLLECTION = require("../models/collection")

// Create a new NFT
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
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
            folder: "Storage",
        });
        if (!cloudinaryResult?.secure_url) {
            throw new Error("Failed to upload image to Cloudinary");
        }
        const imageUrl = cloudinaryResult.secure_url;
        // console.log(imageUrl, "image url");

        const { name, description, collectionId, contractAddress, categoryId, transactionHash, tokenId, quantity } = req.body;

        if (!(name && description && collectionId && contractAddress && transactionHash && tokenId)) {
            return res.status(400).json({ status: false, message: "All fields are required" });
        }

        const findCollection = await Collection.findOne({ collectionId });
        if (!findCollection) {
            return res.status(404).json({ status: false, message: "Collection not found" });
        }

        const category = await Category.findOne({ categoryId });
        if (!category) {
            return res.status(400).json({ status: false, message: "Category does not exist" });
        }
        const checkTrx = await NFT.findOne({ transactionHash });
        if (checkTrx) {
            return res.status(400).json({ status: false, message: "Transaction hash already exists" });
        }

        // Generate tokenId
        const sellCount = await NFT.countDocuments();
        const id = sellCount + 1;

        const metadata = {
            tokenId: tokenId,
            name,
            description,
            collectionName: findCollection.collectionName,
        };

        // // Upload image to Pinata
        const fileBuffer = req.file.buffer; // Use buffer directly

        // Upload image to Pinata
        const fileBlob = new Blob([fileBuffer], { type: req.file.mimetype });
        const imageResult = await pinata.upload.file(fileBlob, {
            metadata: { name: `${name}-image` },
        });

        if (!imageResult?.IpfsHash) {
            throw new Error("Failed to get CID from image upload");
        }
        metadata.image = `ipfs://${imageResult.IpfsHash}`;

        // Upload metadata to Pinata
        const metadataResult = await pinata.upload.json(metadata, {
            metadata: { name: `${name}-metadata` },
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
            tokenId: tokenId,
            collectionId,
            walletAddress,
            name,
            description,
            collectionName: findCollection.collectionName,
            categoryId,
            categoryName: category.name,
            contractAddress,
            imageUrl, // Cloudinary URL
            ownedBy: walletAddress, // Wallet address of the owner
            metadataURL: metadataGatewayURL,
            ipfsImageUrl: imageGatewayURL,
            isMinted: true,
            transactionHash,
            quantity,
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
        const page = parseInt(req.query.page) || 1; // Ensure page is an integer
        const perPage = 20;
        const skip = (page - 1) * perPage;

        const nfts = await SELLNFT.find({}).sort({ _id: 1 }).skip(skip).limit(perPage);
        const totalNFTs = await SELLNFT.countDocuments(); // Get total count for pagination

        return res.status(200).json({
            status: true,
            message: "Get all NFTs for sell",
            data: nfts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalNFTs / perPage),
                totalItems: totalNFTs,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const getNftById = async (req, res) => {
    try {
        const { tokenId, contractAddress } = req.query;
        const nft = await SELLNFT.findOne({ tokenId, contractAddress });
        if (!nft) {
            return res.status(404).json({ status: false, message: "NFT not found" });
        }

        const wallet = nft.ownedBy;

        //owner profile 
        const ownerProfile = await SELLNFT.findOne({ walletAddress: wallet });
        // console.log(ownerProfile)
        const walletAddress = ownerProfile;
        // console.log("wallet", walletAddress);
        const profile = ownerProfile?.profileLogo;
        const userNameOfOwner = ownerProfile?.username;
        // console.log("user name", userNameOfOwner);



        // creator wallet profile
        const creatorProfile = await COLLECTION.findOne({ creatorWallerAddress: wallet })
        // console.log("create profile", creatorProfile);
        const creatorProfileWallet = creatorProfile?.creatorWallerAddress
        const creatorProfileImage = creatorProfile?.logoImage
        const userNameOfCreator = ownerProfile?.username;
        // console.log("userNameOfCreator", userNameOfCreator);

        // console.log("creatr",creatorProfileWallet);



        return res.status(200).json({
            status: true,
            message: "Get nft by id",
            data: nft,
            ownerName: userNameOfOwner,
            ownerWallet: walletAddress,
            ownerWalletProfile: profile,
            creatorname: userNameOfCreator,
            creatorProfileWallet: creatorProfileWallet,
            creatorProfileIMG: creatorProfileImage,

        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const buyNFT = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }
        const walletAddress = verification.data.data.walletAddress;
        const { tokenId, isMinted, transactionHash, quantity, contractAddress, price, } = req.body;

        if (!(tokenId && isMinted && transactionHash)) {
            return res.status(400).json({ status: false, message: "All fields are required" });
        }
        const nft = await SELLNFT.findOne({ tokenId });
        if (price < nft.price) {
            return res.status(400).json({ status: false, message: "Price cannot be lessthan price" });
        }

        if (quantity > nft.quantity) {
            return res.status(400).json({ status: false, message: "Requested quantity exceeds available NFT quantity" });
        }

        const updateNFT = await SELLNFT.updateOne(
            { tokenId },
            {
                $set: {
                    isMinted,
                    onSale: false,
                    ownedBy: walletAddress,
                    transactionHash: transactionHash,
                    contractAddress: contractAddress,
                    price,
                    buyDate: Date.now(),
                },
                $inc: { quantity: -quantity },
            }
        );
        if (!updateNFT) {
            return res.status(404).json({ status: false, message: "NFT not found" });
        }

        const newObj = {
            tokenId: nft.tokenId,
            buyerAddress: walletAddress,
            price: nft.price,
            sellerAddress: nft.ownedBy,
            contractAddress: nft.contractAddress,
            transactionHash: transactionHash,
            quantity: quantity,
            buyDate: Date.now(),
        };
        await BuyingHistory.create(newObj);
        await NFT.updateOne({ tokenId }, { $set: { ownedBy: walletAddress } });
        return res.status(200).json({ status: true, message: "NFT bought successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const listNFTForSale = async (req, res) => {
    try {
        const verification = await verifyToken(req);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }

        const walletAddress = verification.data.data.walletAddress;
        // console.log("walletAddress", walletAddress);
        const { tokenId, price, contractAddress, transactionHash, quantity } = req.body;

        // Validate input
        if (!(tokenId && price && contractAddress && transactionHash && quantity)) {
            return res.status(400).json({ status: false, message: "All fields are required" });
        }

        if (price < 0) {
            return res.status(400).json({ status: false, message: "Price cannot be negative" });
        }

        // Find the NFT
        const nft = await NFT.findOne({ tokenId, contractAddress });
        // console.log("nft", nft);

        if (!nft) {
            return res.status(404).json({ status: false, message: "NFT not found" });
        }

        if (nft.ownedBy !== walletAddress) {
            return res.status(403).json({ status: false, message: "You are not the owner of this NFT" });
        }

        if (nft.onSale === true) {
            return res.status(400).json({ status: false, message: "NFT is already listed for sale" });
        }

        if (quantity > nft.quantity) {
            return res.status(400).json({ status: false, message: "Requested quantity exceeds available NFT quantity" });
        }

        const newObj = {
            tokenId: tokenId,
            name: nft.name,
            description: nft.description,
            imageUrl: nft.imageUrl,
            walletAddress: nft.walletAddress,
            collectionId: nft.collectionId,
            categoryId: nft.categoryId,
            collectionName: nft.collectionName,
            categoryName: nft.categoryName,
            contractAddress,
            ownedBy: nft.ownedBy,
            price,
            transactionHash,
            isMinted: nft.isMinted,
            onSale: true,
            quantity: quantity,
            matadataUrl: nft.metadataURL,
            ipfsImageUrl: nft.ipfsImageUrl,
        };

        // console.log(newObj, "obje");
        await SELLNFT.create(newObj);

        // Update the NFT's onSale status and quantity
       const updatedNFT= await NFT.findOneAndUpdate(
            { tokenId: tokenId ,contractAddress},
            
            {
                $set: { onSale: true },
                $inc: { quantity: -quantity },
            },
            { new: true }
        );
        console.log(updatedNFT)

        return res.status(200).json({
            status: true,
            message: "NFT listed for sale successfully",
            data: newObj,
        });
    } catch (error) {
        console.error("Error listing NFT for sale:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};

const removeNFTFromSale = async (req, res) => {
    try {
        const verification = await verifyToken(req);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }

        const walletAddress = verification.data.data.walletAddress;
        const { tokenId, contractAddress, transactionHash, timestamp } = req.body;

        if (!(tokenId && contractAddress && transactionHash && timestamp)) {
            return res.status(400).json({ status: false, message: "All fields are required" });
        }

        const nft = await SELLNFT.findOne({ tokenId });
        if (!nft) {
            return res.status(404).json({ status: false, message: "NFT not found" });
        }

        if (nft.ownedBy !== walletAddress) {
            return res.status(403).json({ status: false, message: "You are not the owner of this NFT" });
        }

        if (!nft.onSale) {
            return res.status(400).json({ status: false, message: "NFT is not currently for sale" });
        }

        await SELLNFT.updateOne(
            { tokenId },
            {
                $set: {
                    onSale: false,
                    contractAddress: contractAddress,
                    transactionHash: transactionHash,
                    timestamp: timestamp,
                },
            }
        );

        return res.status(200).json({
            status: true,
            message: "NFT removed from sale successfully",
            data: nft,
        });
    } catch (error) {
        console.error("Error removing NFT from sale:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};

const getOwnedNft = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }
        const walletAddress = verification.data.data.walletAddress;
        const nft = await NFT.find({ ownedBy: walletAddress, isMinted: true });

        if (!nft || nft.length === 0) {
            return res.status(404).json({ status: false, message: "No minted NFTs found" });
        }

        return res.status(200).json({
            status: true,
            message: "Minted NFTs retrieved successfully",
            data: nft,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getCreatedNft = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }
        const walletAddress = verification.data.data.walletAddress;
        const nft = await NFT.find({ walletAddress: walletAddress });
        if (!nft || nft.length === 0) {
            return res.status(404).json({ status: false, message: "No created NFT" });
        }

        // Ensure all NFTs belong to the same user
        const isOwner = nft.every((item) => item.walletAddress === walletAddress);
        if (!isOwner) {
            return res.status(403).json({ status: false, message: "You do not own these NFTs" });
        }
        return res.status(200).json({
            status: true,
            message: "Created NFTs retrieved successfully",
            data: nft,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getOnSaleNft = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }
        const walletAddress = verification.data.data.walletAddress;
        const nft = await SELLNFT.find({ ownedBy: walletAddress, onSale: true });
        if (!nft || nft.length === 0) {
            return res.status(404).json({ status: false, message: "No NFTs" });
        }
        return res.status(200).json({
            status: true,
            message: "NFTs on sale retrieved successfully",
            data: nft,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = { createNFT, getNFTs, getNftById, buyNFT, listNFTForSale, removeNFTFromSale, getOwnedNft, getCreatedNft, getOnSaleNft };
