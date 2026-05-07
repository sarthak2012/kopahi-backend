const router = require("express").Router();
const db = require("../db");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");

/* Get the current user's wishlist (with full product docs) */
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const user = await db.users.getWishlist(req.user._id);
    res.json({ success: true, items: user?.wishlist || [] });
  })
);

/* Add a product */
router.post(
  "/:productId",
  protect,
  asyncHandler(async (req, res) => {
    const product = await db.products.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    await db.users.addToWishlist(req.user._id, product._id);
    const user = await db.users.getWishlist(req.user._id);
    res.json({ success: true, items: user?.wishlist || [] });
  })
);

/* Remove a product */
router.delete(
  "/:productId",
  protect,
  asyncHandler(async (req, res) => {
    await db.users.removeFromWishlist(req.user._id, req.params.productId);
    const user = await db.users.getWishlist(req.user._id);
    res.json({ success: true, items: user?.wishlist || [] });
  })
);

module.exports = router;
