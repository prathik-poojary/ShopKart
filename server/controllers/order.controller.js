const crypto = require("crypto");
const mongoose = require("mongoose");

const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const razorpay = require("../config/razorpay");

// -------------------- HELPERS --------------------

// Validate shipping details
const validateShippingAddress = (address) => {
  if (!address || typeof address !== "object" || Array.isArray(address)) {
    return "Shipping address is required";
  }

  const requiredFields = [
    "fullName",
    "phone",
    "addressLine1",
    "city",
    "state",
    "pincode",
  ];

  for (const field of requiredFields) {
    if (typeof address[field] !== "string" || !address[field].trim()) {
      return `${field} is required`;
    }
  }

  if (!/^\d{10}$/.test(address.phone.trim())) {
    return "Phone must contain 10 digits";
  }

  if (!/^\d{6}$/.test(address.pincode.trim())) {
    return "Pincode must contain 6 digits";
  }

  return null;
};

// Reserve stock atomically. This only succeeds if enough stock exists.
const reserveProductStock = async (productId, quantity) => {
  return Product.findOneAndUpdate(
    {
      _id: productId,
      stock: { $gte: quantity },
    },
    {
      $inc: { stock: -quantity },
    },
    { new: true },
  );
};

// Return reserved stock to inventory.
const releaseReservedStock = async (items) => {
  for (const item of items) {
    const result = await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: item.quantity } },
    );

    if (result.matchedCount !== 1) {
      throw new Error(`Could not restore stock for product ${item.product}`);
    }
  }
};

// -------------------- 1. CREATE PAYMENT ORDER --------------------

const createPaymentOrder = async (req, res) => {
  const reservedItems = [];

  try {
    const { shippingAddress } = req.body;

    const addressError = validateShippingAddress(shippingAddress);

    if (addressError) {
      return res.status(400).json({
        success: false,
        message: addressError,
      });
    }

    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    // Get prices from the database, never from the frontend.
    for (const cartItem of customer.cart) {
      const product = await Product.findById(cartItem.product);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart no longer exists",
        });
      }

      const quantity = cartItem.quantity;
      const stock = Number(product.stock);
      const price = Number(product.price);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        !Number.isFinite(stock) ||
        quantity > stock
      ) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for ${product.name}`,
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price,
        quantity,
        image: product.image || "",
      });

      totalAmount += price * quantity;
    }

    totalAmount = Number(totalAmount.toFixed(2));

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Order total must be greater than zero",
      });
    }

    // Reserve inventory before creating the payment order.
    for (const item of orderItems) {
      const reservedProduct = await reserveProductStock(
        item.product,
        item.quantity,
      );

      if (!reservedProduct) {
        await releaseReservedStock(reservedItems);
        reservedItems.length = 0;

        return res.status(409).json({
          success: false,
          message: `Insufficient stock for ${item.name}. Please refresh your cart.`,
        });
      }

      reservedItems.push({
        product: item.product,
        quantity: item.quantity,
      });
    }

    // Razorpay expects paise, not rupees.
    const paymentOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `shopkart_${Date.now()}`,
    });

    const order = await Order.create({
      customer: customer._id,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        addressLine1: shippingAddress.addressLine1.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        pincode: shippingAddress.pincode.trim(),
      },
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
      razorpayOrderId: paymentOrder.id,
      stockReserved: true,
      stockReservationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    // The saved order now owns the reservation.
    reservedItems.length = 0;

    return res.status(201).json({
      success: true,
      message: "Payment order created",
      orderId: order._id,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      razorpayOrderId: paymentOrder.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    // Restore any stock reserved before the failure.
    try {
      await releaseReservedStock(reservedItems);
    } catch (rollbackError) {
      console.error("Stock rollback error:", rollbackError);
    }

    return res.status(500).json({
      success: false,
      message: "Could not create payment order",
    });
  }
};

// -------------------- 2. VERIFY PAYMENT --------------------

const verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        order,
      });
    }

    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Payment order ID does not match",
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay secret is not configured");
    }

    // Calculate the expected signature using the server secret.
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpay_signature, "hex");

    const signatureIsValid =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!signatureIsValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Claim an active reservation and mark the order paid atomically.
    const paidOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        customer: req.user._id,
        paymentStatus: "PENDING",
        stockReserved: true,
        stockReservationExpiresAt: { $gt: new Date() },
      },
      {
        $set: {
          paymentStatus: "PAID",
          status: "PLACED",
          razorpayPaymentId: razorpay_payment_id,
          stockReserved: false,
          stockReservationExpiresAt: null,
        },
      },
      { new: true },
    );

    if (!paidOrder) {
      return res.status(409).json({
        success: false,
        message:
          "The stock reservation has expired or been released. If payment was deducted, contact support.",
      });
    }

    // Stock was already deducted during reservation.
    // Clear the cart only after successful payment verification.
    const customer = await Customer.findById(req.user._id);

    if (customer) {
      customer.cart = [];
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and order placed",
      order: paidOrder,
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not verify payment",
    });
  }
};

// -------------------- 3. RELEASE RESERVATION --------------------

const releasePaymentReservation = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // Only one request can claim and release this reservation.
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        customer: req.user._id,
        paymentStatus: "PENDING",
        stockReserved: true,
      },
      {
        $set: {
          stockReserved: false,
          stockReservationExpiresAt: null,
        },
      },
      { new: true },
    );

    if (!order) {
      const existingOrder = await Order.findOne({
        _id: orderId,
        customer: req.user._id,
      });

      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (existingOrder.paymentStatus === "PAID") {
        return res.status(409).json({
          success: false,
          message: "A paid order cannot release its stock reservation",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Reservation was already released",
      });
    }

    await releaseReservedStock(order.items);

    return res.status(200).json({
      success: true,
      message: "Reserved stock released",
    });
  } catch (error) {
    console.error("Release reservation error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not release stock reservation",
    });
  }
};

// -------------------- 4. CLEAN UP EXPIRED RESERVATIONS --------------------

const releaseExpiredReservations = async () => {
  const now = new Date();

  const expiredOrders = await Order.find({
    paymentStatus: "PENDING",
    stockReserved: true,
    stockReservationExpiresAt: { $lte: now },
  }).select("_id items");

  for (const expiredOrder of expiredOrders) {
    // Claim the expired reservation before restoring inventory.
    const claimedOrder = await Order.findOneAndUpdate(
      {
        _id: expiredOrder._id,
        paymentStatus: "PENDING",
        stockReserved: true,
        stockReservationExpiresAt: { $lte: now },
      },
      {
        $set: {
          stockReserved: false,
          stockReservationExpiresAt: null,
        },
      },
      { new: true },
    );

    if (claimedOrder) {
      try {
        await releaseReservedStock(claimedOrder.items);
      } catch (error) {
        console.error(
          `Could not restore stock for order ${claimedOrder._id}:`,
          error,
        );
      }
    }
  }
};

// Prevent duplicate cleanup timers if this module is reloaded.
if (!global.orderReservationCleanupStarted) {
  global.orderReservationCleanupStarted = true;

  setInterval(() => {
    releaseExpiredReservations().catch((error) => {
      console.error("Expired reservation cleanup error:", error);
    });
  }, 60 * 1000);
}

// -------------------- 5. GET MY ORDERS --------------------

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not fetch orders",
    });
  }
};

// -------------------- 6. GET ONE ORDER --------------------

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not fetch order",
    });
  }
};

// -------------------- EXPORTS --------------------

module.exports = {
  createPaymentOrder,
  verifyPayment,
  releasePaymentReservation,
  getMyOrders,
  getOrderById,
};
