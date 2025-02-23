const express = require('express');
const router = express.Router();
const { uploadNFTImg } = require('../middlewares/fileUpload');
const { createNFT, getNFTs, getNftById, buyNFT, listNFTForSale, removeNFTFromSale } = require('../controllers/nft');

router.post('/create', uploadNFTImg, createNFT);
router.get('/get', getNFTs);
router.get('/get/:tokenId', getNftById);
router.post('/list-for-sale', listNFTForSale);
router.post('/remove-from-sale', removeNFTFromSale);
router.post('/buy', buyNFT);



module.exports = router;