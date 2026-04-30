const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { sendLead } = require("../controllers/contactController");

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many submissions. Try again later." },
});

router.post("/", contactLimiter, sendLead);

module.exports = router;
