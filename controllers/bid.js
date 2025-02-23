const Bid = require('../models/bid');
const { User } = require('../models/user');
const NFT = require('../models/nft');
const BuyingHistory = require('../models/buyhistory');
const { verifyToken } = require('../services/tokenServices');



// place bid    
const placeBid = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ message: verification.message });
        }
        const walletAddress = verification.data.data.walletAddress;
        const { tokenId, bidAmount, bidExpiry, transactionHash, contract } = req.body;
        if (!(tokenId && bidAmount && bidExpiry && transactionHash && contract)) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(bidExpiry));

        const nft = await NFT.findOne({ tokenId });
        console.log(nft,);


        // Verify ownership
        if (nft.walletAddress !== walletAddress) {
            return res.status(403).json({ status: false, message: 'You are not the owner of this NFT' });
        }

        if (!nft || !nft.isForSale) {
            return res.status(400).json({ status: false, message: 'NFT not available for bidding' });
        }

        if (bidAmount <= (nft.price || 0)) {
            return res.status(400).json({ status: false, message: 'Bid amount must exceed current price' });
        }


        const countBid = await Bid.countDocuments();
        const bidId = countBid + 1;
        const bid = new Bid({
            bidId,
            tokenId,
            bidAmount,
            bidExpiry: expiryDate,
            transactionHash,
            contract,
            bidderAddress: walletAddress
        });
        await bid.save();
        return res.status(201).json({ status: true, message: 'Bid placed successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// get all bids
const getAllBids = async (req, res) => {
    try {
        const allBid = await Bid.find({}).sort({ bidAmount: -1, createdAt: -1 });
        return res.status(200).json({ status: true, message: "Get all bids", data: allBid });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// get bid by id

const getBidById = async (req, res) => {
    try {
        const { bidId } = req.params;
        const bid = await Bid.findOne({ bidId });
        if (!bid) {
            return res.status(404).json({ status: false, message: "Bid not found" });
        }
        return res.status(200).json({ status: true, message: "Get bid by id", data: bid });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// accept bid
const acceptBid = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ message: verification.message });
        }
        const walletAddress = verification.data.data.walletAddress;
        const { bidId, transactionHash } = req.body;
        if (!(bidId && transactionHash)) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const bid = await Bid.find({ bidId });
        if (!bid) {
            return res.status(404).json({ status: false, message: 'Bid not found' });
        }
        console.log(bid[0]);

        // Manually fetch the NFT
        const nft = await NFT.findOne({ tokenId: bid[0].tokenId });
        if (!nft) {
            return res.status(404).json({ status: false, message: 'NFT not found' });
        }
        if (bid[0].status !== 'pending') {
            return res.status(400).json({ status: false, message: 'Bid is not in pending state' });
        }
        if (bid[0].bidExpiry && bid[0].bidExpiry < new Date()) {
            bid[0].status = 'expired';
            await bid[0].save();
            return res.status(400).json({ status: false, message: 'Bid has expired' });
        }

        // Fetch seller and buyer
        const seller = await User.findOne({ walletAddress: nft.walletAddress });
        const buyer = await User.findOne({ walletAddress: bid[0].bidderAddress });

        if (!seller || !buyer) {
            return res.status(400).json({ status: false, message: 'Seller or buyer not found' });
        }

        // Update NFT ownership
        nft.walletAddress = bid[0].bidderAddress;
        nft.isForSale = false;
        nft.buyerAddress = buyer.walletAddress;
        nft.transactionHash = transactionHash;
        nft.buyDate = Date.now();
        await nft.save();

        // Update bid status
        bid.status = 'accepted';
        await bid[0].save();

        // Record buying history
        await BuyingHistory.create({
            tokenId: nft.tokenId,
            buyerAddress: buyer.walletAddress,
            buyDate: Date.now(),
            price: bid[0].amount,
            sellerAddress: seller.walletAddress,
            contractAddress: nft.contractAddress,
            transactionHash: transactionHash
        });

        return res.status(200).json({
            status: true,
            message: 'Bid accepted successfully'
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


module.exports = { placeBid, getAllBids, getBidById, acceptBid }