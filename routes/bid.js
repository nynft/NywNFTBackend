const express = require("express");
const router = express.Router();

const { placeBid, getAllBids, getBidById, acceptBid } = require("../controllers/bid");

router.post("/place", placeBid);
router.get("/all", getAllBids);
router.get("/get/:bidId", getBidById);
router.post("/accept", acceptBid);

module.exports = router;