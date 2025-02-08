const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema(
  {
    collectionId: {
      type: Number,
    },
    collectionName: {
      type: String,
      require: true,
    },
    collectionSymbol: {
      type: String,
      require: true,
    },
    creator: {
      type: String,
    },
    creatorWallerAddress: {
      type: String,
      require: true,
    },
    image: {
      type: String,
      default: "",
    },
    contractAddress: {
      type: String,
      required: true,
    },
    royalty: {
      percentage: { type: Number, min: 0, max: 10 },
      recipient: { type: String }, // Wallet address receiving royalties
    },
    description: {
      type: String,
      maxlength: 300,
    },
    collectionCreationHash: {
      type: String,
      require: true,
    },
    mintQuantity: {
      type: Number, //Number of minted quantity
    },
    createdAt: {
      type: Date,
    },
  },
  { versionKey: false }
);

const Collection = mongoose.model("Collection", collectionSchema);
module.exports = Collection;
