const mongoose = require('mongoose');

const sellSchema = new mongoose.Schema({
    tokenId: { type: String, required: true },
    name: { type: String },
    description: { type: String },
    imageUrl: { type: String },
    walletAddress: { type: String },
    collectionId: { type: Number },
    categoryId: { type: Number },
    categoryName: { type: String },
    collectionName: { type: String },
    contractAddress: { type: String, required: true },
    transactionHash: { type: String, required: true },
    price: { type: Number },
    ownedBy: { type: String },
    isMinted: { type: Boolean, default: false },
    onSale: { type: Boolean, default: false },
    metadataURL: { type: String },
    ipfsImageUrl: { type: String },
    quantity: { type: Number, required: true }
}, { versionKey: false, timestamps: true });

const SELLNFT = mongoose.model('SellNFT', sellSchema);
module.exports = SELLNFT;
