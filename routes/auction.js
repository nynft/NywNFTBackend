const express = require("express");
const router = express.Router();

const { auctionCreated, getAllAuction, getAuctionById, placeBid, auctionSettled, cancelAuction, extendAuction } = require("../controllers/auction");

router.post("/created", auctionCreated);
router.get("/all", getAllAuction);
router.get("/get/:auctionId", getAuctionById);
router.post("/place", placeBid);
router.post('/settled', auctionSettled);
router.post('/cancel', cancelAuction);
router.post('/extend', extendAuction);

module.exports = router;