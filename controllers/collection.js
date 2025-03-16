
const Category = require('../models/category');
const Collection = require('../models/collection');
const { verifyToken } = require('../services/tokenServices');
const { removeUnwantedCollectionImg } = require('../utils/removeImages');
const { cloudinary, uploadToCloudinary } = require('../services/cloudinaryServices');


// create collection for user

const createCollection = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }
        // Ensure a single file is uploaded
        if (!req.file) {
            return res.status(400).json({ status: false, message: "Collection image is required" });
        }
        // Upload image to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
            folder: "Storage",
        });
        if (!cloudinaryResult?.secure_url) {
            throw new Error("Failed to upload image to Cloudinary");
        }
        const imageUrl = cloudinaryResult.secure_url;

        const { collectionName, collectionSymbol, categoryId, contractAddress, royalty, description, collectionCreationHash, nftStandard, isDrop, createdTimestamp } = req.body;

        // Validate nftStandard
        const validNftStandards = ["ERC-721", "ERC-1155"];
        if (!validNftStandards.includes(nftStandard)) {
            return res.status(400).json({ status: false, message: `Invalid nftStandard value. Allowed values are: ${validNftStandards.join(", ")}` });
        }


        const collectionCount = await Collection.countDocuments();
        const id = parseInt(collectionCount) + 1;
        let obj = {
            collectionId: id,
            collectionName,
            collectionSymbol,
            logoImage: imageUrl,
            creatorWallerAddress: verification.data.data.walletAddress,
            contractAddress,
            royalty,
            description,
            collectionCreationHash,
            nftStandard,
            isDrop,
            createdTimestamp
        };
        await Collection.create(obj);
        return res.status(201).json({ status: true, message: "Collection created successfully", data: obj });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "Internal Server Error" });
    }
}


// Get all collection for perticular user

const getAllUserCollection = async (req, res) => {
    try {
        const collection = await Collection.find({});
        if (!collection) {
            return res.status(404).json({ status: false, message: "No collection found" })
        }
        return res.status(200).json({ status: true, message: "Collection found", data: collection })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "Internal Server Error" })
    }
}

// check unique collection name
const checkUniqueCollectionName = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message })
        }
        const { collectionName } = req.body;
        const collection = await Collection.findOne({ collectionName })
        if (collection) {
            return res.status(400).json({ status: false, message: "Collection name already exists" })
        } else {
            return res.status(200).json({ status: true, message: "Valid Collection" })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "Internal Server Error" })
    }
}

const collectionByUserId = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message })
        }
        const walletAddress = verification.data.data.walletAddress;
        const findUserCollection = await Collection.find({ creatorWallerAddress: walletAddress })
        if (!findUserCollection) {
            return res.status(404).json({ status: false, message: "No collection found" })
        }
        return res.status(200).json({ status: true, message: "Collection found", data: findUserCollection })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "Internal Server Error" })
    }
}

const getCreatedCollection = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message })
        }
        const walletAddress = verification.data.data.walletAddress;
        const findUserCollection = await Collection.find({ creatorWallerAddress: walletAddress })

        if (!findUserCollection || findUserCollection.length === 0) {
            return res.status(404).json({ status: false, message: 'No created collection' })
        }
        // Ensure all NFTs belong to the same user
        const isOwner = findUserCollection.every(item => item.creatorWallerAddress === walletAddress);
        if (!isOwner) {
            return res.status(403).json({ status: false, message: 'You do not own these collection' });
        }

        return res.status(200).json({
            status: true,
            message: 'Collections retrieved successfully',
            data: findUserCollection
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" })
    }
}


module.exports = { createCollection, getAllUserCollection, checkUniqueCollectionName, collectionByUserId, getCreatedCollection }