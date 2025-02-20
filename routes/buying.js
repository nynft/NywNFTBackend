const express = require("express");
const router = express.Router();

const { buyNft } = require("../controllers/buying");

router.post("/nft", buyNft);




module.exports = router;