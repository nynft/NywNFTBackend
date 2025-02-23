const mongoose = require('mongoose');

const buyingHistory = new mongoose.Schema({
  tokenId: { type: String },
  buyerAddress: { type: String },
  sellerAddress: { type: String },
  amount: { type: Number },
  contractAddress: { type: String, required: true },
  transactionHash: { type: String, required: true },
  buyDate: { type: Date, default: Date.now },
}, { versionKey: false });

const BuyHistory = mongoose.model('BuyingHistory', buyingHistory);
module.exports = BuyHistory;
