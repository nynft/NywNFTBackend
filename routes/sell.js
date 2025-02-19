const express = require("express");
const router = express.Router();
const { uploadNFTImg } = require('../middlewares/fileUpload');

const { sellNft, getAllSellNft, getNftById } = require("../controllers/sell");

router.post("/nft", uploadNFTImg, sellNft);
router.get("/all", getAllSellNft);
router.get("/get/:tokenId", getNftById);



module.exports = router;