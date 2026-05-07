const router = require("express").Router();
const db = require("../db");
const protect = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const { recordAudit } = require("../utils/auditLogger");
const logger = require("../utils/logger");

const ALLOWED_STATUS = ["Placed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled"];

/*
 * Validate a coupon code against the cart subtotal. Returns a normalized
 * { coupon, discount } pair or null. Caller decides what to do with null.
 */
async function resolveCoupon(code, subtotal) {
  if (!code) return null;
  const coupon = await db.coupons.findByCode(code);
  if (!coupon) return { error: "Invalid coupon code" };
  if (!coupon.active) return { error: "This coupon is no longer active" };
  if (coupon.expiresAt && coupon.expiresAt < new Date())
    return { error: "This coupon has expired" };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
    return { error: "This coupon has reached its usage limit" };
  if (subtotal < (coupon.minSubtotal || 0))
    return { error: `Minimum order ₹${coupon.minSubtotal} required for this coupon` };

  let discount = Math.round((subtotal * coupon.percentDiscount) / 100);
  if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
  return { coupon, discount };
}

/* Public: validate a coupon for a given subtotal (used by cart UI) */
router.post(
  "/coupon/validate",
  asyncHandler(async (req, res) => {
    const { code, subtotal } = req.body || {};
    if (!code) return res.status(400).json({ success: false, message: "Coupon code required" });
    const result = await resolveCoupon(code, Number(subtotal) || 0);
    if (!result || result.error) {
      return res.status(400).json({ success: false, message: result?.error || "Invalid coupon" });
    }
    res.json({
      success: true,
      coupon: {
        code: result.coupon.code,
        percentDiscount: result.coupon.percentDiscount,
        description: result.coupon.description,
      },
      discount: result.discount,
    });
  })
);

/* Place order — auth required, server computes prices from DB */
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { items, shippingAddress, paymentMethod, couponCode } = req.body || {};

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
      if ((product.stock || 0) < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name} (have ${product.stock || 0}, need ${qty})`,
        });
      }
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

    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const result = await resolveCoupon(couponCode, itemsPrice);
      if (!result || result.error) {
        return res.status(400).json({
          success: false,
          message: result?.error || "Invalid coupon",
        });
      }
      discount = result.discount;
      appliedCoupon = result.coupon;
    }

    const discountedSubtotal = Math.max(0, itemsPrice - discount);
    const shippingPrice = discountedSubtotal >= 999 ? 0 : 99;
    const taxPrice = Math.round(discountedSubtotal * 0.05);
    const totalPrice = discountedSubtotal + shippingPrice + taxPrice;

    // Atomically decrement stock for every item. If any fails, roll back the
    // ones we already decremented. Real solution wants a Mongo transaction
    // (replicaset-only) — this is the pragmatic single-node version.
    const decremented = [];
    for (const line of computed) {
      const updated = await db.products.decrementStock(line.product, line.quantity);
      if (!updated) {
        for (const undo of decremented) {
          await db.products.updateById(undo.product, { $inc: { stock: undo.quantity } });
        }
        return res.status(409).json({
          success: false,
          message: `Stock changed while placing your order — please retry`,
        });
      }
      decremented.push(line);
    }

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
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      couponDiscount: discount,
    });

    if (appliedCoupon) {
      await db.coupons.incrementUsage(appliedCoupon._id);
    }

    // Clear server-side cart for this user (no-op if they were using local cart)
    try {
      await db.users.clearCart(req.user._id);
    } catch (err) {
      logger.warn("cart_clear_after_order_failed", {
        userId: req.user._id.toString(),
        err: err.message,
        requestId: req.id,
      });
    }

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
    const previous = order.orderStatus;
    order.orderStatus = orderStatus;
    if (orderStatus === "Delivered") order.deliveredAt = new Date();
    await order.save();
    await recordAudit(req, {
      action: "order.status_change",
      targetType: "Order",
      targetId: order._id,
      metadata: { from: previous, to: orderStatus },
    });
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
    await recordAudit(req, {
      action: "order.mark_paid",
      targetType: "Order",
      targetId: order._id,
    });
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
    // Restore stock
    for (const line of order.items) {
      await db.products.updateById(line.product, { $inc: { stock: line.quantity } });
    }
    await recordAudit(req, {
      action: "order.cancel",
      targetType: "Order",
      targetId: order._id,
    });
    res.json({ success: true, message: "Order cancelled", order });
  })
);

module.exports = router;
