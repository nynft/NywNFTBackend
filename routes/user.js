const express = require("express");
const router = express.Router();
const {verifyMagicLogin,logout,userProfile} = require("../controllers/user");
const authMiddleware = require("../middleware/auth");

router.post("/magic-login", verifyMagicLogin);
router.post("/logout", logout);
router.get("/profile", authMiddleware, userProfile);

module.exports = router;
