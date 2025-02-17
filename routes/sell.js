const express = require("express");
const router = express.Router();

const { sellNft } = require("../controllers/sell");

router.post("/sell-nft", sellNft);



module.exports = router;