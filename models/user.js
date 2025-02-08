const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: { type: Number, unique: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true },
    // password: { type: String, minlength: 8 },
    bio: { type: String, maxlength: 300 },
    profileImage: { type: String, default: "" },
    walletAddress: { type: String, unique: true },
    createdAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
  }, { versionKey: false });


const userTokenSchema = new mongoose.Schema({
  userId: { type: Number },
  token: { type: String },
  active: { type: Number, default: 1 },
  expiresIn: { type: Number }
}, { versionKey: false })

const User = mongoose.model("User", userSchema);
const UserToken = mongoose.model("UserToken", userTokenSchema);

module.exports = { User, UserToken };
