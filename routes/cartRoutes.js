const router = require("express").Router();
const db = require("../db");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");

const sanitizeItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((i) => ({
      product: i.product || i.productId,
      quantity: Math.max(1, Math.min(50, Number(i.quantity) || 1)),
    }))
    .filter((i) => i.product);
};

/* Get cart for current user (populated with product docs) */
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const user = await db.users.getCart(req.user._id);
    res.json({ success: true, items: user?.cart || [] });
  })
);

/* Replace cart with provided items (used on login to merge / push state) */
router.put(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const items = sanitizeItems(req.body?.items);
    await db.users.replaceCart(req.user._id, items);
    const user = await db.users.getCart(req.user._id);
    res.json({ success: true, items: user?.cart || [] });
  })
);

/* Clear cart */
router.delete(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    await db.users.clearCart(req.user._id);
    res.json({ success: true, items: [] });
  })
);

module.exports = router;
