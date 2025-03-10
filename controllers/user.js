const { User, UserToken } = require("../models/user");
const { Magic } = require("@magic-sdk/admin");
const { createToken } = require("../services/tokenServices");
const magic = new Magic(process.env.MAGIC_SECRET_KEY);
require("dotenv").config();
const { verifyToken } = require("../services/tokenServices");
const NFT = require('../models/nft');
const Collection = require('../models/collection');
const { sendConfirmationMail, sendWelcommingMail } = require('../services/emailService');
const { cloudinary, uploadToCloudinary } = require('../services/cloudinaryServices');

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
    const verification = await verifyToken(req, res);

    if (!verification.isVerified) {
      return res.status(401).json({ status: false, message: verification.message });
    }
    return res.status(200).json({
      status: true,
      message: "User profile fetched successfully",
      data: verification.data.data,
    });
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

const logoutUser = async (req, res) => {
  try {
    const verification = await verifyToken(req, res);
    if (!verification.isVerified) {
      return res.status(401).json({ status: false, message: verification.message });
    }
    const token = verification.token;
    await UserToken.findOneAndUpdate({ token: token }, { $set: { active: 0 } });
    return res.status(200).json({ message: "User logged out successfully" });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" })
  }
}


const getUserProfileAssets = async (req, res) => {
  try {
    const verification = await verifyToken(req, res);
    if (!verification.isVerified) {
      return res.status(401).json({ status: false, message: verification.message });
    }
    let walletAddress = verification.data.data.walletAddress;
    const userData = await User.findOne({ walletAddress: walletAddress })
    if (!userData) {
      return res.status(404).json({ status: false, message: "User not found" })
    }
    const nft = await NFT.find({ walletAddress });
    const collection = await Collection.find({ creatorWallerAddress: walletAddress });

    let allData = [...nft, ...collection]
    return res.status(200).json({ status: true, message: "Get user profile assets successfully", data: allData })

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" })
  }
}


const updateProfile = async (req, res) => {
  try {
    let field1, field2;
    const verification = await verifyToken(req, res);
    if (!verification.isVerified) {
      return res.status(401).json({ status: false, message: verification.message });
    }
    const walletAddress = verification.data.data.walletAddress;
    const userData = await User.findOne({ walletAddress: walletAddress })
    if (!userData) {
      return res.status(404).json({ status: false, message: "User not found" })
    }
    if (!req.files || !req.files["field1"] || !req.files["field2"]) {
      return res.status(400).json({ status: false, message: "Files are required" });
    }
    field1 = req.files["field1"];
    field2 = req.files["field2"];
    const { username, email, bio, twitterName } = req.body;
    // **Upload Images to Cloudinary**
    const logoImageResult = await uploadToCloudinary(field1[0].buffer);
    const bannerImageResult = await uploadToCloudinary(field2[0].buffer);
    const findUserName = await User.findOne({ username: username })
    if (findUserName) {
      return res.status(400).json({ status: false, message: "Username already exists" })
    }
    const findEmail = await User.findOne({ email: email })
    if (findEmail) {
      return res.status(400).json({ status: false, message: "Email already exists" })
    }
    await User.updateOne({ walletAddress: walletAddress }, {
      $set: {
        username: username,
        email: email,
        bio: bio,
        profileLogo: logoImageResult.secure_url,
        profileBanner: bannerImageResult.secure_url,
        twitterName
      },
    }, { new: true })
    // Send confirmation mail
    sendConfirmationMail(email, username);
    return res.status(200).json({ status: true, message: "Update user profile successfully" })

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" })
  }
}
module.exports = { verifyMagicLogin, logout, userProfile, loginWithWallet, logoutUser, getUserProfileAssets, updateProfile };
