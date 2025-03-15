const NFT = require('../models/nft');
const BuyingHistory = require('../models/buyhistory');
const { verifyToken } = require('../services/tokenServices');
const Auction = require('../models/auction');

// auction created
const auctionCreated = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }
        const { auctionId, tokenId, startTime, endTime, startPrice, minIncrementAmount, transactionHash, contractAddress, quantity } = req.body;

        const walletAddress = verification.data.data.walletAddress;

        if (!(auctionId && tokenId && startTime && endTime && startPrice && minIncrementAmount && transactionHash && contractAddress && quantity)) {
            return res.status(400).json({ status: false, message: 'All fields are requied' });
        }

        const nft = await NFT.findOne({ tokenId });
        if (!nft) {
            return res.status(404).json({ status: false, message: "Token not found" });
        }

        if (nft.ownedBy !== walletAddress) {
            return res.status(403).json({ status: false, message: 'You are not the owner of this NFT' });
        }

        if (quantity > nft.quantity) {
            return res.status(400).json({ status: false, message: 'Requested quantity exceeds available NFT quantity' });
        }

        const newObj = {
            auctionId,
            tokenId,
            walletAddress: walletAddress,
            startPrice,
            minIncrementAmount,
            contractAddress,
            quantity,
            startTime,
            endTime,
            auctionStatus: 'pending'
        }
        await Auction.create(newObj);
        return res.status(201).json({ status: true, message: "Auction is created successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

// get all auction
const getAllAuction = async (req, res) => {
    try {
        const auction = await Auction.find({});
        return res.status(200).json({ status: true, message: "Get all auction", data: auction });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

// get auction by id
const getAuctionById = async (req, res) => {
    try {
        const auctionId = req.params.id;
        const auction = await Auction.findById(auctionId);
        if (!auction) {
            return res.status(404).json({ status: false, message: "Auction not found" })
        }
        return res.status(200).json({ status: true, message: "Get auction by id", data: auction })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

// place bid    
const placeBid = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ message: verification.message });
        }
        const walletAddress = verification.data.data.walletAddress;
        const { auctionId, amount } = req.body;
        if (!(auctionId && amount)) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const auction = await Auction.findById(auctionId);
        if (!auction) {
            return res.status(404).json({ status: false, message: "Auction not found" })
        }
        // check if the user has enough balance
        if (auction.startPrice < amount) {
            return res.status(400).json({ message: "Bid amount should be greater than the start amount" })
        }

        await Auction.updateOne({ auctionId }, {
            $set: {
                amount: amount,
                bidderAddress: walletAddress
            }
        })

        return res.status(200).json({ status: true, message: 'Bid placed successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// auction settled
const auctionSettled = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ message: verification.message });
        }
        const walletAddress = verification.data.data.walletAddress;
        const { auctionId, auctionStatus, amount } = req.body
        if (!(auctionId && auctionStatus && amount)) {
            return res.status(400).json({ status: false, message: "All fields are required" });
        }

        const auction = await Auction.findById(auctionId);
        if (!auction) {
            return res.status(404).json({ status: false, message: "Auction not found" })
        }
        // check if the auction is already settled
        if (auction.auctionStatus === 'winner') {
            return res.status(400).json({ status: false, message: "Auction already settled" })
        }

        await Auction.updateOne({ auctionId }, {
            $set: {
                auctionStatus: auctionStatus,
                amount: amount,
                ownedBy: walletAddress,
            }
        })


        // Record buying history
        // await BuyingHistory.create({
        //     tokenId: nft.tokenId,
        //     buyerAddress: buyer.walletAddress,
        //     buyDate: Date.now(),
        //     price: bid[0].amount,
        //     sellerAddress: seller.walletAddress,
        //     contractAddress: nft.contractAddress,
        //     transactionHash: transactionHash
        // });


        return res.status(200).json({
            status: true,
            message: 'Auction is settled'
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Auction Cancelled
const cancelAuction = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }
        const walletAddress = verification.data.data.walletAddress;
        const { auctionId, transactionHash } = req.body;
        const auction = await Auction.findOne({ auctionId });
        if (!auction) {
            return res.status(404).json({ status: false, message: "Auction not found" })
        }
        if (auction.auctionStatus === 'winner') {
            return res.status(400).json({ status: false, message: "Auction already settled" })
        }
        if (auction.ownedBy !== walletAddress) {
            return res.status(403).json({ status: false, message: "You are not the owner of this auction" })
        }
        // Update auction status to cancelled
        await Auction.updateOne({ auctionId }, {
            $set: {
                auctionStatus: 'cancelled',
                transactionHash: transactionHash
            }
        })
        return res.status(200).json({ status: true, message: "Auction cancelled successfully" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" })
    }
}


// Auction Extended
const extendAuction = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }
        const walletAddress = verification.data.data.walletAddress;
        const { auctionId, endTime, transactionHash } = req.body;
        if (!(auctionId && transactionHash && endTime)) {
            return res.status(400).json({ status: false, message: "All fields are required" })
        }
        const auction = await Auction.findOne({ auctionId });
        if (!auction) {
            return res.status(404).json({ status: false, message: "Auction not found" })
        }
        if (auction.auctionStatus === 'winner') {
            return res.status(400).json({ status: false, message: "Auction already settled" })
        }
        if (auction.ownedBy !== walletAddress) {
            return res.status(403).json({ status: false, message: "You are not the owner of this auction" })
        }
        // Update auction status to extended
        await Auction.updateOne({ auctionId }, {
            $set: {
                // auctionStatus: 'extended',
                transactionHash: transactionHash,
                endTime: endTime
            }
        });
        return res.status(200).json({ status: true, message: "Auction extended successfully" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" })
    }
}


module.exports = { auctionCreated, getAllAuction, getAuctionById, placeBid, auctionSettled, cancelAuction, extendAuction }