const router = require("express").Router();
const db = require("../db");
const protect = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const asyncHandler = require("../middleware/asyncHandler");

const ALLOWED_STATUS = ["Placed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled"];

/* Place order — auth required, server computes prices from DB */
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { items, shippingAddress, paymentMethod } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order must contain at least one item" });
    }
    if (!shippingAddress || !shippingAddress.address) {
      return res.status(400).json({ success: false, message: "Shipping address is required" });
    }

    const productIds = items.map((i) => i.product).filter(Boolean);
    const products = await db.products.findByIds(productIds);
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const computed = [];
    let itemsPrice = 0;

    for (const i of items) {
      const product = productMap.get(String(i.product));
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${i.product}`,
        });
      }
      const qty = Math.max(1, Math.min(50, Number(i.quantity) || 1));
      const lineTotal = product.price * qty;
      itemsPrice += lineTotal;
      computed.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        price: product.price,
        quantity: qty,
      });
    }

    const shippingPrice = itemsPrice >= 999 ? 0 : 99;
    const taxPrice = Math.round(itemsPrice * 0.05);
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    const order = await db.orders.create({
      user: req.user._id,
      items: computed,
      shippingAddress,
      paymentMethod: paymentMethod === "Online" ? "Online" : "COD",
      paymentStatus: "Pending",
      orderStatus: "Placed",
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    });

    res.status(201).json({ success: true, message: "Order placed", order });
  })
);

/* My orders */
router.get(
  "/mine",
  protect,
  asyncHandler(async (req, res) => {
    const orders = await db.orders.findByUser(req.user._id);
    res.json({ success: true, count: orders.length, orders });
  })
);

/* All orders — admin */
router.get(
  "/",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const orders = await db.orders.listAll();
    res.json({ success: true, count: orders.length, orders });
  })
);

/* Single order — owner or admin */
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const order = await db.orders.findByIdWithUser(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (req.user.role !== "admin" && String(order.user._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    res.json({ success: true, order });
  })
);

/* Update status — admin */
router.put(
  "/:id/status",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { orderStatus } = req.body || {};
    if (!ALLOWED_STATUS.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }
    const order = await db.orders.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    order.orderStatus = orderStatus;
    if (orderStatus === "Delivered") order.deliveredAt = new Date();
    await order.save();
    res.json({ success: true, message: "Order status updated", order });
  })
);

/* Mark paid — admin (or webhook in future) */
router.put(
  "/:id/pay",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const order = await db.orders.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    order.paymentStatus = "Paid";
    order.paidAt = new Date();
    await order.save();
    res.json({ success: true, message: "Payment marked as paid", order });
  })
);

/* Cancel — owner or admin */
router.put(
  "/:id/cancel",
  protect,
  asyncHandler(async (req, res) => {
    const order = await db.orders.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (req.user.role !== "admin" && String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    if (["Shipped", "Delivered"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ${order.orderStatus.toLowerCase()} order`,
      });
    }
    order.orderStatus = "Cancelled";
    await order.save();
    res.json({ success: true, message: "Order cancelled", order });
  })
);

module.exports = router;
