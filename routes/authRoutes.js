const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const protect = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerification,
} = require("../controllers/authController");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again later." },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many reset attempts. Try again later." },
});

router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);
router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);
router.put("/me/password", protect, changePassword);

router.post("/forgot-password", passwordResetLimiter, requestPasswordReset);
router.post("/reset-password", passwordResetLimiter, resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", protect, resendVerification);

module.exports = router;
