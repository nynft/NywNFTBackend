const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema(
  {
    collectionId: { type: Number },
    collectionName: { type: String, require: true },
    collectionSymbol: { type: String, require: true },
    categoryId: { type: Number, required: true },
    categoryName: { type: String },
    creatorWallerAddress: { type: String, require: true },
    logoImage: { type: String, default: "" },
    bannerImage: { type: String, default: "" },
    contractAddress: { type: String, required: true },
    description: { type: String, maxlength: 300 },
    collectionCreationHash: { type: String, require: true },
    nftStandard: { type: String, enum: ["ERC-721", "ERC-1155"], required: true },
    mintQuantity: {
      type: Number, //Number of minted quantity
    }
  }, { versionKey: false, timestamps: true });

const Collection = mongoose.model("Collection", collectionSchema);
module.exports = Collection;
