const { User } = require("../models/user");
const { Magic } = require("@magic-sdk/admin");
const { createToken } = require("../services/tokenServices");
const magic = new Magic(process.env.MAGIC_SECRET_KEY);
require("dotenv").config();

// Magic Link Login

const verifyMagicLogin = async (req, res) => {
  try {
    const { didToken } = req.body; // Frontend should send didToken
    if (!didToken) {
      return res.status(400).json({ success: false, message: "DID Token is required." });
    }
    console.log(didToken, "token");

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


    const userPayload = {
      userId: user.userId,
      username: metadata.email.split("@")[0],
      email: metadata.email,
      walletAddress: metadata.publicAddress?.toLocaleLowerCase() || "",
    };

    const verification = await createToken(req, res, userPayload);

    if (verification.isVerified) {
      return res.status(200).json({
        status: true,
        message: 'Login successful',
        data: {
          userId: user.userId,
          username: metadata.email.split("@")[0],
          email: metadata.email,
          walletAddress: metadata.publicAddress?.toLocaleLowerCase() || "",
          active: 1,
          token: verification.token,
        },
        // token: verification.token,
      });
    } else {
      return res.status(401).json({ status: false, message: 'Unauthorized user!' });
    }
  } catch (error) {
    console.error("Magic Link Verification Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
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

const loginWithWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ success: false, message: "Wallet address is required." });
    }

    // Check if the user already exists
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (!user) {
      // If the user does not exist, create a new user
      const countUser = await User.countDocuments();
      const userId = countUser + 1;
      const isVerified = countUser < 1000;

      user = await User.create({
        userId,
        walletAddress: walletAddress.toLowerCase(),
        verified: isVerified,
      });
    }

    // Generate a token for the user (new or existing)
    const verification = await createToken(req, res, user);

    if (verification.isVerified) {
      return res.status(200).json({
        status: true,
        message: 'Login successful',
        data: {
          userId: user.userId,
          walletAddress: user.walletAddress,
          active: 1,
          token: verification.token,
        },
      });
    } else {
      return res.status(401).json({ status: false, message: 'Unauthorized user!' });
    }
  } catch (error) {
    console.error("Error in loginWithWallet:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
module.exports = { verifyMagicLogin, logout, userProfile, loginWithWallet };
