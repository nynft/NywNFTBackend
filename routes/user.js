const express = require("express");
const router = express.Router();
const { verifyMagicLogin, logout, userProfile, loginWithWallet } = require("../controllers/user");

router.post("/magic-login", verifyMagicLogin);
router.post("/logout", logout);
router.get("/profile", userProfile);
router.post("/login-with-wallet", loginWithWallet);

module.exports = router;
