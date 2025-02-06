const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: { type: Number },
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      sparse: true, // Allows users without email (wallet-only login)
    },
    password: {
      type: String, // Required only for email-based login
      minlength: 8,
    },
    bio: { type: String, maxlength: 300 },
    profileImage: {
      type: String, // URL to IPFS or centralized storage (AWS S3)
      default: "",
    },
    walletAddress: { type: String, unique: true, sparse: true }, // Wallet-only login
    createdAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
  },
  { versionKey: false }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
