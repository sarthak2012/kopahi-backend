const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const protect = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
} = require("../controllers/authController");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again later." },
});

router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);
router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);

module.exports = router;
