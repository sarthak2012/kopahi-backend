const router = require("express").Router();
const db = require("../db");
const protect = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const asyncHandler = require("../middleware/asyncHandler");

const slugify = (name) =>
  String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const categories = await db.categories.list();
    res.json({ success: true, count: categories.length, categories });
  })
);

router.post(
  "/",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { name, image } = req.body || {};
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });
    const category = await db.categories.create({
      name,
      slug: slugify(name),
      image: image || "",
    });
    res.status(201).json({ success: true, message: "Category created", category });
  })
);

router.put(
  "/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const category = await db.categories.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    if (req.body.name) {
      category.name = req.body.name;
      category.slug = slugify(req.body.name);
    }
    if (req.body.image !== undefined) category.image = req.body.image;
    await category.save();
    res.json({ success: true, category });
  })
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const category = await db.categories.deleteById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    res.json({ success: true, message: "Category deleted" });
  })
);

module.exports = router;
