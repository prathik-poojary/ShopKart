const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  createPaymentOrder,
  verifyPayment,
  releasePaymentReservation,
  getMyOrders,
  getOrderById,
} = require("../controllers/order.controller");

router.post("/create-payment-order", authMiddleware, createPaymentOrder);
router.post("/verify-payment", authMiddleware, verifyPayment);
router.post("/release-reservation", authMiddleware, releasePaymentReservation);

router.get("/", authMiddleware, getMyOrders);
router.get("/:id", authMiddleware, getOrderById);

module.exports = router;
