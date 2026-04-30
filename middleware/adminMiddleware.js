const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ success: false, message: "Admin access only" });
};

const vendorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "vendor" || req.user.role === "admin")) {
    return next();
  }
  return res.status(403).json({ success: false, message: "Vendor or admin access only" });
};

module.exports = adminOnly;
module.exports.adminOnly = adminOnly;
module.exports.vendorOrAdmin = vendorOrAdmin;
