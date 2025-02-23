const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const cartSchema = new mongoose.Schema(
    {
        walletAddress: { type: String },
        items: [
            {
                _id: false,
                tokenId: { type: String },
                name: { type: String },
                description: { type: String },
                imageUrl: { type: [String] },
                collectionId: { type: Number },
                collectionName: { type: String },
                contractAddress: { type: String },
                transactionHash: { type: String },
                price: { type: Number, default: 0 },
            }
        ],
        totalPrice: { type: Number, default: 0 },
        totalItems: { type: Number, default: 0 }, // Renamed from totalItem for consistency
        isPurchased: { type: Boolean, default: false }, // Renamed from isBuy for clarity
    },
    { versionKey: false, timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;