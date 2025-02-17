const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String, // Bidder's wallet address
      required: true,
    },
    tokenId: {
      type: Number,
      required: true,
    },
    bidAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    bidExpiry: {
      type: Date, // Auto-expiry time for bid
      required: true,
    },
    transactionHash: {
      type: String, // Transaction
      required: true,
    },
    contract: {
      type: String, // Collection contract address
      required: true,
    },
    onBId: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

const Bid = mongoose.model("Bid", bidSchema);
module.exports = Bid;
