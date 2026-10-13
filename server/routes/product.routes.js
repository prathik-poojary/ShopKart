const express = require("express");

const {
    createProduct,
    getProducts,
    getProduct
} = require("../controllers/product.controller");

const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.post(
    "/",
    upload.single("image"),
    createProduct
);

router.get("/", getProducts);

router.get("/:id", getProduct);

module.exports = router;