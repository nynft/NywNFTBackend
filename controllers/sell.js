const Sell = require('../models/sell');
const { verifyToken } = require('../services/tokenServices');

//sell nft
const sellNft = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }
        const walletAddress = verification.data.data.walletAddress;
        // console.log(verification, "walletAddress");

        const { sellAmount, sellExpiry, transactionHash, contract } = req.body;
        if (!(sellAmount && sellExpiry && transactionHash && contract)) {
            return res.status(400).json({ status: false, message: "All fields are required" });
        }

        const sell = new Sell({
            sellAmount,
            sellExpiry,
            transactionHash,
            contract,
            seller: walletAddress,
        });

        await sell.save();
        return res.status(201).json({ status: true, message: "NFT listed for sale" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { sellNft };