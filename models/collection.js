const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema(
  {
    collectionId: { type: Number },
    collectionName: { type: String, require: true },
    collectionSymbol: { type: String, require: true },
    creatorWallerAddress: { type: String, require: true },
    logoImage: { type: String, default: "" },
    contractAddress: { type: String, required: true },
    description: { type: String, maxlength: 300 },
    collectionCreationHash: { type: String, require: true },
    nftStandard: { type: String, enum: ["ERC-721", "ERC-1155"], required: true },
    royalty: {
      percentage: { type: Number, min: 0, max: 10 },
      recipient: { type: String }, // Wallet address receiving royalties
    },
    mintQuantity: {
      type: Number, //Number of minted quantity
    },
    isDrop: { type: Boolean, default: false, required: true },
    createdTimestamp: { type: Date },
  }, { versionKey: false, timestamps: true });

const Collection = mongoose.model("Collection", collectionSchema);
module.exports = Collection;
