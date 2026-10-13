const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const mongoose = require("mongoose");

const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const user = await Customer.findById(req.user._id);

    const cartItem = user.cart.find(
      (item) => item.product.toString() === productId,
    );

    if (cartItem) {
      const newQuantity = cartItem.quantity + 1;

      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: "Insufficient stock",
        });
      }

      cartItem.quantity = newQuantity;
    } else {
      if (product.stock < 1) {
        return res.status(400).json({
          success: false,
          message: "Product out of stock",
        });
      }

      user.cart.push({
        product: productId,
        quantity: 1,
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart: user.cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getCart = async (req, res) => {
  try {
    const user = await Customer.findById(req.user._id).populate({
      path: "cart.product",
      select: "name price category image stock",
    });

    res.status(200).json({
      success: true,
      count: user.cart.length,
      cart: user.cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: "Quantity exceeds available stock",
      });
    }

    const user = await Customer.findById(req.user._id);

    const cartItem = user.cart.find(
      (item) => item.product.toString() === productId,
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart",
      });
    }

    cartItem.quantity = quantity;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      cart: user.cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const user = await Customer.findById(req.user._id);

    const cartItem = user.cart.find(
      (item) => item.product.toString() === productId,
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart",
      });
    }

    user.cart = user.cart.filter(
      (item) => item.product.toString() !== productId,
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart: user.cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { addToCart, getCart, updateCartQuantity, removeFromCart };
