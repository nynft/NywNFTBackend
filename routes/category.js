const express = require("express");
const router = express.Router();

const { createCategory, getAllCategories, getCategoryById } = require("../controllers/category");

router.post("/create", createCategory);
router.get("/get-all", getAllCategories);
router.get("/get/:categoryId", getCategoryById);



module.exports = router;