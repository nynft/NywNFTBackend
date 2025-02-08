const { User, UserToken } = require("../models/user");
const jwt = require("jsonwebtoken");
const { Magic } = require("@magic-sdk/admin");
const magic = new Magic(process.env.MAGIC_SECRET_KEY);
require("dotenv").config();

// Magic Link Login

const verifyMagicLogin = async (req, res) => {
  try {
    const { didToken } = req.body; // Frontend should send didToken
    if (!didToken) {
      return res.status(400).json({ success: false, message: "DID Token is required." });
    }

    // Verify the Magic token
    const metadata = await magic.users.getMetadataByToken(didToken);

    // Count the number of users in the database
    const countUser = await User.countDocuments();

    // Check if user already exists
    let user = await User.findOne({
      $or: [
        { email: metadata.email },
        { walletAddress: metadata.publicAddress },
      ],
    });

    if (!user) {
      // Set `verified: true` for the first 1000 users, otherwise false
      const isVerified = countUser < 1000;

      // Create a new user if not found
      user = await User.create({
        userId: countUser + 1,
        username: metadata.email.split("@")[0],
        email: metadata.email,
        walletAddress: metadata.publicAddress?.toLocaleLowerCase() || "",
        oauthProvider: "magic",
        oauthId: metadata.issuer,
        verified: isVerified, // First 1000 users get verified status
      });

      await user.save();
    }

    // Generate JWT token for authentication
    const token = jwt.sign(
      { userId: user._id, email: user.email, verified: user.verified },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    await UserToken.create({ userId: user.userId, token, expiresIn: token.expiresIn });

    return res.json({ success: true, token, user });
  } catch (error) {
    console.error("Magic Link Verification Error:", error);
    return res.status(500).json({ success: false, message: "Magic Login Failed" });
  }
};

// Logout route
const logout = async (req, res) => {
  try {
    const { didToken } = req.body;
    await magic.users.logoutByToken(didToken);
    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Logout failed" });
  }
};

const userProfile = async (req, res) => {
  try {
    return res.status(200).json({ status: true, message: "User profile", data: req.user })
  } catch (error) {
    return res.status(500).json({ error: "Logout failed" });
  }
};

const registerWithWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ success: false, message: "Wallet address is required." });
    }
    const user = await User.findOne({ walletAddress });
    if (user) {
      return res.status(400).json({ success: false, message: "Wallet address already exists." });
    }
    const countUser = await User.countDocuments();
    const isVerified = countUser < 1000;
    const userCreated = await User.create({
      userId: countUser + 1,
      username: "",
      email: "",
      walletAddress: walletAddress,
      verified: isVerified,
    });
    await userCreated.save();

    return res.status(201).json({ success: true, user: userCreated });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Logout failed" });
  }
}

module.exports = { verifyMagicLogin, logout, userProfile };
