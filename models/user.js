const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: { type: Number, unique: true },
    username: { type: String, unique: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true },
    bio: { type: String, maxlength: 300 },
    profileLogo: { type: String, default: "" },
    profileBanner: { type: String, default: "" },
    walletAddress: { type: String, unique: true },
    verified: { type: Boolean, default: false },
    twitterName: { type: String }
  }, { versionKey: false, timestamps: true });


const userTokenSchema = new mongoose.Schema({
  userId: { type: Number },
  token: { type: String },
  active: { type: Number, default: 1 },
  expiresIn: { type: Number }
}, { versionKey: false })

const User = mongoose.model("User", userSchema);
const UserToken = mongoose.model("UserToken", userTokenSchema);

module.exports = { User, UserToken };
