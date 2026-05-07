const router = require("express").Router();
const db = require("../db");
const protect = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const { recordAudit } = require("../utils/auditLogger");

router.use(protect, adminOnly);



router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const [totalUsers, totalVendors, totalProducts, totalOrders, leads, revenue] =
      await Promise.all([
        db.users.count({ role: "user" }),
        db.users.count({ role: "vendor" }),
        db.products.count(),
        db.orders.count(),
        db.leads.count(),
        db.orders.totalPaidRevenue(),
      ]);

    res.json({
      success: true,
      totalUsers,
      totalVendors,
      totalProducts,
      totalOrders,
      leads,
      revenue,
    });
  })
);

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await db.users.list();
    res.json({ success: true, count: users.length, users });
  })
);

router.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const orders = await db.orders.listAll();
    res.json({ success: true, count: orders.length, orders });
  })
);

router.get(
  "/leads",
  asyncHandler(async (req, res) => {
    const leads = await db.leads.list();
    res.json({ success: true, count: leads.length, leads });
  })
);

router.get(
  "/audit",
  asyncHandler(async (req, res) => {
    const logs = await db.audit.list({
      page: req.query.page,
      pageSize: req.query.pageSize,
      action: req.query.action,
    });
    res.json({ success: true, count: logs.length, logs });
  })
);

router.delete(
  "/product/:id",
  asyncHandler(async (req, res) => {
    const product = await db.products.deleteById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    await recordAudit(req, {
      action: "admin.product_delete",
      targetType: "Product",
      targetId: req.params.id,
      metadata: { name: product.name },
    });
    res.json({ success: true, message: "Product deleted" });
  })
);

router.delete(
  "/user/:id",
  asyncHandler(async (req, res) => {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }
    const user = await db.users.deleteById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    await recordAudit(req, {
      action: "admin.user_delete",
      targetType: "User",
      targetId: req.params.id,
      metadata: { email: user.email, role: user.role },
    });
    res.json({ success: true, message: "User deleted" });
  })
);

module.exports = router;
