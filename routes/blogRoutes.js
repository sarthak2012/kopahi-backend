const router = require("express").Router();
const db = require("../db");
const protect = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const { recordAudit } = require("../utils/auditLogger");

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { count, page, pages, items } = await db.blog.listPublished({
      page: req.query.page,
      pageSize: req.query.pageSize,
    });
    res.json({ success: true, page, pages, count, posts: items });
  })
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const post = await db.blog.findBySlug(req.params.slug);
    if (!post || !post.published) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    res.json({ success: true, post });
  })
);

router.post(
  "/",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (!data.title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (!data.slug) data.slug = `${slugify(data.title)}-${Date.now().toString(36)}`;
    const post = await db.blog.create(data);
    await recordAudit(req, {
      action: "blog.create",
      targetType: "BlogPost",
      targetId: post._id,
      metadata: { title: post.title },
    });
    res.status(201).json({ success: true, post });
  })
);

router.put(
  "/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const post = await db.blog.updateById(req.params.id, req.body);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    await recordAudit(req, {
      action: "blog.update",
      targetType: "BlogPost",
      targetId: post._id,
    });
    res.json({ success: true, post });
  })
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const post = await db.blog.deleteById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    await recordAudit(req, {
      action: "blog.delete",
      targetType: "BlogPost",
      targetId: req.params.id,
    });
    res.json({ success: true, message: "Post deleted" });
  })
);

module.exports = router;
