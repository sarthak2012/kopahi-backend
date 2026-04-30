const router = require("express").Router();
const crypto = require("crypto");
const db = require("../db");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const razorpay = require("../utils/razorpay");

const paymentsConfigured = () =>
  !!razorpay && !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;

/* Create Razorpay order from a Kopahi order id */
router.post(
  "/razorpay/order",
  protect,
  asyncHandler(async (req, res) => {
    if (!paymentsConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Payments are not configured on this server",
      });
    }

    const { orderId } = req.body || {};
    const order = await db.orders.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const rOrder = await razorpay.orders.create({
      amount: Math.round(order.totalPrice * 100),
      currency: "INR",
      receipt: String(order._id),
    });

    res.json({ success: true, razorpayOrder: rOrder, keyId: process.env.RAZORPAY_KEY_ID });
  })
);

/* Verify Razorpay signature & mark order paid */
router.post(
  "/razorpay/verify",
  protect,
  asyncHandler(async (req, res) => {
    if (!paymentsConfigured()) {
      return res.status(503).json({ success: false, message: "Payments are not configured" });
    }

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment fields" });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const order = await db.orders.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    order.paymentStatus = "Paid";
    order.paidAt = new Date();
    await order.save();

    res.json({ success: true, order });
  })
);

module.exports = router;
