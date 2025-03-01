const mongoose = require('mongoose');

const nftSchema = new mongoose.Schema({
    tokenId: { type: Number },
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    walletAddress: { type: String },
    collectionId: { type: Number, required: true },
    collectionName: { type: String },
    contractAddress: { type: String, required: true },
    transactionHash: { type: String, required: true },
    buyerAddress: { type: String },
    price: { type: Number },
    isMinted: { type: Boolean, default: false },
    isForSale: { type: Boolean, default: false },
    buyDate: { type: Date },
    sellExpiry: { type: Date },
    metadataURL: { type: String },
    ipfsImageUrl: { type: String },
}, { versionKey: false });

const NFT = mongoose.model('NFT', nftSchema);
module.exports = NFT;
