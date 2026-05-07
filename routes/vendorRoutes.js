const router = require("express").Router();
const db = require("../db");
const protect = require("../middleware/authMiddleware");
const { vendorOrAdmin } = require("../middleware/adminMiddleware");
const asyncHandler = require("../middleware/asyncHandler");

router.use(protect, vendorOrAdmin);

/* Vendor's own products */
router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const products = await db.products.findByVendor(req.user._id);
    res.json({ success: true, count: products.length, products });
  })
);

/* Vendor stats */
router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const products = await db.products.findByVendor(req.user._id);
    const inStock = products.filter((p) => (p.stock || 0) > 0).length;
    res.json({
      success: true,
      totalProducts: products.length,
      inStock,
      outOfStock: products.length - inStock,
    });
  })
);

module.exports = router;
