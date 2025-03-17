const mongoose = require('mongoose');

const nftSchema = new mongoose.Schema({
    tokenId: { type: String },
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    walletAddress: { type: String },
    collectionId: { type: Number, required: true },
    categoryId: { type: Number, required: true },
    categoryName: { type: String },
    collectionName: { type: String },
    contractAddress: { type: String, required: true },
    transactionHash: { type: String, required: true },
    buyerAddress: { type: String },
    price: { type: Number },
    ownedBy: { type: String },
    isMinted: { type: Boolean, default: false },
    onSale: { type: Boolean, default: false },
    buyDate: { type: Date },
    metadataURL: { type: String },
    ipfsImageUrl: { type: String },
    quantity: { type: Number, required: true }
}, { versionKey: false, timestamps: true });

const NFT = mongoose.model('NFT', nftSchema);
module.exports = NFT;
