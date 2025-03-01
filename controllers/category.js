
const Category = require('../models/category');

//create category

const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ status: false, message: "Name is required" });
        }
        const categoryExist = await Category.findOne({ name });
        if (categoryExist) {
            return res.status(400).json({ status: false, message: "Category already exist" });
        }

        const count = await Category.countDocuments();
        const category = new Category({
            categoryId: count + 1,
            name,
        });

        await category.save();
        return res.status(201).json({ status: true, message: "Category created" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
}

//get all categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        return res.status(200).json({ status: true, message: "All category", data: categories });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
}

//get category by id
const getCategoryById = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await Category.findOne({ categoryId });
        if (!category) {
            return res.status(404).json({ status: false, message: "Category not found" });
        }
        return res.status(200).json({ status: true, message: "Category found", data: category });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
}

module.exports = { createCategory, getAllCategories, getCategoryById };