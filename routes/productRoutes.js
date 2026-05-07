const router = require("express").Router();
const db = require("../db");
const upload = require("../utils/uploadCloudinary");
const protect = require("../middleware/authMiddleware");
const { adminOnly, vendorOrAdmin } = require("../middleware/adminMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const escapeRegex = require("../utils/escapeRegex");
const { recordAudit } = require("../utils/auditLogger");

const slugify = (name) =>
  String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/* Upload single product image — vendors and admins */
router.post(
  "/upload",
  protect,
  vendorOrAdmin,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }
    const url = upload.usingCloudinary
      ? req.file.path
      : `/uploads/products/${req.file.filename}`;
    res.json({ success: true, image: url, url });
  }
);

/* List products (paginated, searchable, category filter) */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { isActive: { $ne: false } };
    if (req.query.keyword) {
      filter.name = { $regex: escapeRegex(req.query.keyword), $options: "i" };
    }
    if (req.query.category && req.query.category !== "All") {
      filter.category = req.query.category;
    }

    const { count, page, pages, items } = await db.products.list(filter, {
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    res.json({ success: true, page, pages, count, products: items });
  })
);

/* Featured products */
router.get(
  "/featured/list",
  asyncHandler(async (req, res) => {
    const products = await db.products.findFeatured(8);
    res.json({ success: true, products });
  })
);

/* Single product */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await db.products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product });
  })
);

/* Create product — vendors and admins. Vendors are auto-attached as owner. */
router.post(
  "/",
  protect,
  vendorOrAdmin,
  asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (!data.slug && data.name) data.slug = `${slugify(data.name)}-${Date.now()}`;
    if (req.user.role === "vendor") data.vendor = req.user._id;
    const product = await db.products.create(data);
    await recordAudit(req, {
      action: "product.create",
      targetType: "Product",
      targetId: product._id,
      metadata: { name: product.name },
    });
    res.status(201).json({ success: true, message: "Product created", product });
  })
);

/* Update product — admin always; vendor only on their own product */
router.put(
  "/:id",
  protect,
  vendorOrAdmin,
  asyncHandler(async (req, res) => {
    const product = await db.products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (
      req.user.role === "vendor" &&
      String(product.vendor || "") !== String(req.user._id)
    ) {
      return res
        .status(403)
        .json({ success: false, message: "You can only edit your own products" });
    }
    const updates = { ...req.body };
    if (req.user.role === "vendor") delete updates.vendor;
    const updated = await db.products.updateById(req.params.id, updates);
    await recordAudit(req, {
      action: "product.update",
      targetType: "Product",
      targetId: updated._id,
      metadata: { changedKeys: Object.keys(updates) },
    });
    res.json({ success: true, message: "Product updated", product: updated });
  })
);

/* Delete product — admin always; vendor only on their own */
router.delete(
  "/:id",
  protect,
  vendorOrAdmin,
  asyncHandler(async (req, res) => {
    const existing = await db.products.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (
      req.user.role === "vendor" &&
      String(existing.vendor || "") !== String(req.user._id)
    ) {
      return res
        .status(403)
        .json({ success: false, message: "You can only delete your own products" });
    }
    await db.products.deleteById(req.params.id);
    await recordAudit(req, {
      action: "product.delete",
      targetType: "Product",
      targetId: req.params.id,
      metadata: { name: existing.name },
    });
    res.json({ success: true, message: "Product deleted" });
  })
);

module.exports = router;
