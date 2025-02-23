const express = require("express");
const router = express.Router();
const { addItemToCart, getCart, getCartById, removeCartItem } = require("../controllers/cart");

router.post("/add", addItemToCart);
router.get("/get", getCart);
router.get("/get/:id", getCartById);
router.delete("/remove/:id", removeCartItem);



module.exports = router;