const buyItem = new mongoose.Schema({
  buyerAddress: {
    type: String,
    required: true,
  },
  tokenId: {
    type: Number,
  },
  amount: {
    type: Number,
    required: true,
  },
  contractAddress: {
    type: String,
    required: true,
  },
  transactioHash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});
