const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema({
  auctionId: { type: String, required: true },
  walletAddress: { type: String },
  tokenId: { type: String, required: true },
  bidderAddress: { type: [String] },
  startPrice: { type: Number, required: true },
  minIncrementAmount: { type: Number, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  ownedBy: { type: String },// wallet address of the owner
  transactionHash: { type: String, required: true },
  contractAddress: { type: String, required: true },
  auctionStatus: { type: String, enum: ['active', 'ended', 'cancelled', 'winner'], default: 'active' },
  // onBId: { type: Boolean, default: false },
  quantity: { type: Number, required: true },
  amount: { type: [Number] },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });

const Auction = mongoose.model("Auction", auctionSchema);
module.exports = Auction;
