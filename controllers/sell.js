const Sell = require('../models/sell');
const Collection = require('../models/collection');
const { verifyToken } = require('../services/tokenServices');

//sell nft
const sellNft = async (req, res) => {
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

        // Validate required fields
        const { sellAmount, sellExpiry, collectionId, transactionHash, contract, nftName, nftDescription } = req.body;
        if (!(sellAmount && sellExpiry && transactionHash && contract && collectionId)) {
            return res.status(400).json({ status: false, message: "All fields are required" });
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(sellExpiry));

        // Check if collection exists
        const findCollection = await Collection.findOne({ collectionId: collectionId });
        if (!findCollection) {
            return res.status(404).json({ status: false, message: "Collection not found" });
        }

        // Create new Sell entry with imageUrl
        const sellCount = await Sell.countDocuments();
        const id = sellCount + 1;

        // const metadata = {
        //     tokenId: id,
        //     collectionId,
        //     nftName,
        //     nftDescription,
        //     collectionName: findCollection.collectionName,
        //     contract,
        //     transactionHash,
        // }

        // const imageBuffer = await fs.promises.readFile(files[0].path);

        // // Upload metadata and image to IPFS
        // const imageResult = await ipfs.add(imageBuffer, { wrapWithDirectory: false });

        // // Store the image CID in the metadata
        // metadata.image = `ipfs://${imageResult[0].hash}`;

        // const metadataResult = await ipfs.add(Buffer.from(JSON.stringify(metadata)));


        // // Create gateway URLs for metadata and image
        // const metadataGatewayURL = `${process.env.INFURA_IPFS_ENDPOINT}/ipfs/${metadataResult[0].hash}`;
        // const imageGatewayURL = `${process.env.INFURA_IPFS_ENDPOINT}/ipfs/${imageResult[0].hash}`;




        const sell = new Sell({
            tokenId: id,
            collectionId,
            nftName,
            nftDescription,
            collectionName: findCollection.collectionName,
            sellAmount,
            sellExpiry: expiryDate,
            transactionHash,
            contract,
            seller: walletAddress,
            imageUrl: imageUrl, // Include image URLs here
            // metadataURL: metadataGatewayURL,
            // ipfsImageUrl: imageGatewayURL,

        });

        await sell.save();
        return res.status(201).json({ status: true, message: "NFT listed for sale" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};


const getAllSellNft = async (req, res) => {
    try {
        const sellNfts = await Sell.find().populate("collectionId");
        return res.status(200).json({ status: true, message: "Get all nft for sale", data: sellNfts });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "Internal Server Error" })
    }
}

const getNftById = async (req, res) => {
    try {
        const { tokenId } = req.params;
        const nft = await Sell.findOne({ tokenId: tokenId });
        if (!nft) {
            return res.status(404).json({ status: false, message: "NFT not found" })
        }
        return res.status(200).json({ status: true, message: "NFT found", data: nft });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "Internal Server Error" })
    }
}



module.exports = { sellNft, getAllSellNft, getNftById };