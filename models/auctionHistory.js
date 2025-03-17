const mongoose = require('mongoose');

const auctionHistory = new mongoose.Schema({
    auctionId: { type: String, required: true },
    tokenId: { type: String, required: true },
    auctionOwnerAddress: { type: String, required: true },
    winnerAmount: { type: Number, required: true },
    auctionWinnerAddress: { type: String, required: true },
    contractAddress: { type: String, required: true },
    transactionHash: { type: String, required: true },
    auctionBuyDate: { type: Date, default: Date.now }
}, { versionKey: false })

const AuctionHistory = mongoose.model('AuctionHistory', auctionHistory);
module.exports = AuctionHistory;