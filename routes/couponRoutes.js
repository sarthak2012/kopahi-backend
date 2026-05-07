const router = require("express").Router();
const db = require("../db");
const protect = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const { recordAudit } = require("../utils/auditLogger");

router.get(
  "/",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const coupons = await db.coupons.list();
    res.json({ success: true, count: coupons.length, coupons });
  })
);

router.post(
  "/",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { code, percentDiscount, description, minSubtotal, maxDiscount, usageLimit, expiresAt, active } =
      req.body || {};
    if (!code || percentDiscount == null) {
      return res
        .status(400)
        .json({ success: false, message: "Code and percentDiscount are required" });
    }
    const coupon = await db.coupons.create({
      code: String(code).toUpperCase().trim(),
      percentDiscount: Number(percentDiscount),
      description: description || "",
      minSubtotal: Number(minSubtotal) || 0,
      maxDiscount: Number(maxDiscount) || 0,
      usageLimit: Number(usageLimit) || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      active: active !== false,
    });
    await recordAudit(req, {
      action: "coupon.create",
      targetType: "Coupon",
      targetId: coupon._id,
      metadata: { code: coupon.code },
    });
    res.status(201).json({ success: true, coupon });
  })
);

router.put(
  "/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const coupon = await db.coupons.updateById(req.params.id, req.body);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    await recordAudit(req, {
      action: "coupon.update",
      targetType: "Coupon",
      targetId: coupon._id,
    });
    res.json({ success: true, coupon });
  })
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const coupon = await db.coupons.deleteById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    await recordAudit(req, {
      action: "coupon.delete",
      targetType: "Coupon",
      targetId: req.params.id,
      metadata: { code: coupon.code },
    });
    res.json({ success: true, message: "Coupon deleted" });
  })
);

module.exports = router;
