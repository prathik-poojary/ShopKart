const Product = require("../models/product.model");
const uploadToCloudinary = require("../utils/uploadToCloudinary");


// CREATE PRODUCT
const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            category,
            stock
        } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Product image is required"
            });
        }

        const uploadResult = await uploadToCloudinary(
            req.file.buffer
        );

        const product = await Product.create({
            name,
            description,
            price,
            category,
            stock,
            image: uploadResult.secure_url
        });

        res.status(201).json({
            success: true,
            product
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// GET ALL PRODUCTS
const getProducts = async (req, res) => {
    try {
        const { search, category } = req.query;

        let query = {};

        if (search) {
            query.name = {
                $regex: search,
                $options: "i"
            };
        }

        if (category) {
            query.category = category;
        }

        const products = await Product.find(query);

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// GET SINGLE PRODUCT
const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid product ID"
        });
    }
};


module.exports = {
    createProduct,
    getProducts,
    getProduct
};