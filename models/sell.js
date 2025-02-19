const mongoose = require("mongoose");

const sellSchema = new mongoose.Schema(
  {
    walletAddress: { type: String }, //seller address
    tokenId: { type: Number },
    nftName: { type: String, required: true },
    nftDescription: { type: String, required: true },//description of the nft
    sellAmount: { type: Number, required: true, min: 0 },
    collectionId: { type: Number, required: true },
    collectionName: { type: String },
    imageUrl: { type: [String] },//image of the nft
    sellExpiry: { type: Date, required: true },
    transactionHash: { type: String, required: true },
    contract: { type: String, required: true }, // collection contract addresss
    onSale: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  }, { versionKey: false });

const Sell = mongoose.model("Sell", sellSchema);
module.exports = Sell;
