const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema({
  auctionId: { type: String, required: true },
  walletAddress: { type: String },
  tokenId: { type: String, required: true },
  bids: [{
    _id: false,// disable _id field
    bidderAddress: { type: String },
    amount: { type: Number },
    transactionHash: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  winnerAddress: { type: String },
  startPrice: { type: Number, required: true },
  minIncrementAmount: { type: Number, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  ownedBy: { type: String },// wallet address of the owner
  transactionHash: { type: String, required: true },
  contractAddress: { type: String, required: true },
  auctionStatus: { type: String, enum: ['active', 'ended', 'cancelled', 'winner'], default: 'active' },
  quantity: { type: Number, required: true },
  winnerAmount: { type: Number },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });

const Auction = mongoose.model("Auction", auctionSchema);
module.exports = Auction;
