const mongoose = require('mongoose');

const buyingHistory = new mongoose.Schema({
  tokenId: { type: String, required: true },
  buyerAddress: { type: String, required: true },
  sellerAddress: { type: String, required: true },
  price: { type: Number, required: true },
  contractAddress: { type: String, required: true },
  transactionHash: { type: String, required: true },
  quantity: { type: Number, required: true },
  buyDate: { type: Date, default: Date.now },
}, { versionKey: false });

const BuyHistory = mongoose.model('BuyingHistory', buyingHistory);
module.exports = BuyHistory;
