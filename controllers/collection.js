
const Category = require('../models/category');
const Collection = require('../models/collection');
const { verifyToken } = require('../services/tokenServices');
const { removeUnwantedCollectionImg } = require('../utils/removeImages');
const { cloudinary, uploadToCloudinary } = require('../services/cloudinaryServices');


// create collection for user

const createCollection = async (req, res) => {
    let field1, field2;
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }
        if (!req.files || !req.files["field1"] || !req.files["field2"]) {
            return res.status(400).json({ status: false, message: "Files are required" });
        }
        field1 = req.files["field1"];
        field2 = req.files["field2"];

        const { collectionName, collectionSymbol, categoryId, contractAddress, royalty, description, collectionCreationHash, nftStandard } = req.body;

        // Validate nftStandard
        const validNftStandards = ["ERC-721", "ERC-1155"];
        if (!validNftStandards.includes(nftStandard)) {
            return res.status(400).json({ status: false, message: `Invalid nftStandard value. Allowed values are: ${validNftStandards.join(", ")}` });
        }

        let collectionExists = await Collection.findOne({ collectionName });
        if (collectionExists) {
            await removeUnwantedCollectionImg(field1[0].filename);
            await removeUnwantedCollectionImg(field2[0].filename);
            return res.status(400).json({ status: false, message: "Collection already exists !" });
        }

        const category = await Category.findOne({ categoryId });
        if (!category) {
            return res.status(400).json({ status: false, message: "Category does not exist" });
        }

        // **Upload Images to Cloudinary**
        const logoImageResult = await uploadToCloudinary(field1[0].buffer);
        const bannerImageResult = await uploadToCloudinary(field2[0].buffer);

        const collectionCount = await Collection.countDocuments();
        const id = parseInt(collectionCount) + 1;
        let obj = {
            collectionId: id,
            collectionName,
            collectionSymbol,
            categoryId,
            categoryName: category.name,
            logoImage: logoImageResult.secure_url,
            bannerImage: bannerImageResult.secure_url,
            creatorWallerAddress: verification.data.data.walletAddress,
            contractAddress,
            // royalty,
            description,
            collectionCreationHash,
            nftStandard,
            featured: true,
        };
        await Collection.create(obj);
        return res.status(201).json({ status: true, message: "Collection created successfully", data: obj });
    } catch (error) {
        console.log(error);
        if (field1 && field1[0]) {
            await removeUnwantedCollectionImg(field1[0].filename);
        }
        if (field2 && field2[0]) {
            await removeUnwantedCollectionImg(field2[0].filename);
        }
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



module.exports = { createCollection, getAllUserCollection, checkUniqueCollectionName, collectionByUserId }