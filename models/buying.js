const mongoose = require('mongoose');

const buyItem = new mongoose.Schema({
  buyerAddress: { type: String, required: true },
  tokenId: { type: Number },
  amount: { type: Number, required: true },
  contractAddress: { type: String, required: true },
  transactionHash: { type: String, required: true },
  // nftStandard: { type: String, enum: ["ERC-721", "ERC-1155"], required: true },
  onSale: { type: Boolean, default: false },
  buyDate: { type: Date, default: Date.now },
}, { versionKey: false });

const BuyItem = mongoose.model('BuyItem', buyItem);
module.exports = BuyItem;
