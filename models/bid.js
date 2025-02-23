const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema({
  bidId: { type: Number },// unique identifier for the bid
  // walletAddress: { type: String, required: true },
  tokenId: { type: Number, required: true },
  bidderAddress: { type: String },
  bidAmount: { type: Number, required: true, min: 0 },
  bidExpiry: { type: Date, required: true },
  transactionHash: { type: String, required: true },
  contract: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'expired'], default: 'pending' },
  onBId: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });

const Bid = mongoose.model("Bid", bidSchema);
module.exports = Bid;
