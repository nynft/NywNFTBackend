const express = require('express');
const router = express.Router();
const { uploadNFTImg } = require('../middlewares/fileUpload');
const { createNFT, getNFTs, getNftById, buyNFT, listNFTForSale, removeNFTFromSale, getOwnedNft, getCreatedNft, getOnSaleNft } = require('../controllers/nft');

router.post('/create', uploadNFTImg, createNFT);
router.get('/get', getNFTs);
router.get('/get/tokenId', getNftById);
router.post('/list-for-sale', listNFTForSale);
router.post('/remove-from-sale', removeNFTFromSale);
router.post('/buy', buyNFT);
router.get('/owned', getOwnedNft);
router.get('/get-created', getCreatedNft);
router.get('/get-on-sale', getOnSaleNft);



module.exports = router;