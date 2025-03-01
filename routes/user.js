const express = require("express");
const router = express.Router();
const { verifyMagicLogin, logout, userProfile, loginWithWallet, logoutUser } = require("../controllers/user");

router.post("/magic-login", verifyMagicLogin);
router.post("/logout", logout);
router.get("/profile", userProfile);
router.post("/login-with-wallet", loginWithWallet);
router.post("/logout-user", logoutUser);
module.exports = router;
