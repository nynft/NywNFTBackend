const mongoose = require("mongoose");

const sellSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String, // seller's wallet address
      required: true,
    },
    tokenId: {
      type: Number,
      required: true,
    },
    sellAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    sellExpiry: {
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
    onSale: {
      type: Boolean,
      default: falses,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

const Sell = mongoose.model("Sell", sellSchema);
module.exports = Sell;
