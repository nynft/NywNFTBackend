const BuyItem = require('../models/buying');
const { User } = require('../models/user');
const { verifyToken } = require('../services/tokenServices');
const Sell = require('../models/sell');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;


//Buy the nft

const buyNft = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }
        const walletAddress = verification.data.data.walletAddress;

        const { tokenId, amount, contractAddress, transactionHash } = req.body;
        if (!(tokenId && amount && contractAddress && transactionHash)) {
            return res.status(400).json({ status: false, message: "All fields are required" });
        }
        const findToken = await Sell.find({ tokenId });
        if (findToken.length === 0) {
            return res.status(404).json({ status: false, message: "Token not found" });
        }

        const obj = {
            tokenId: tokenId,
            buyerAddress: walletAddress,
            amount: amount,
            contractAddress: contractAddress,
            transactionHash: transactionHash
        }
        await BuyItem.create(obj);
        return res.status(200).json({
            status: true,
            message: "NFT purchase processed successfully",
            data: obj
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { buyNft }