const bcrypt = require("bcryptjs");
const db = require("../db");
const generateToken = require("../utils/generateToken");
const asyncHandler = require("../middleware/asyncHandler");

exports.registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, businessName } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email and password are required",
    });
  }

  const exists = await db.users.findByEmail(email);
  if (exists) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists",
    });
  }

  const hashed = await bcrypt.hash(password, 10);
  const allowedRole = role === "vendor" ? "vendor" : "user";

  const user = await db.users.create({
    name,
    email: String(email).toLowerCase(),
    password: hashed,
    phone: phone || "",
    role: allowedRole,
    businessName: allowedRole === "vendor" ? businessName || "" : "",
  });

  res.status(201).json({
    success: true,
    message: "Registered successfully",
    token: generateToken(user),
    user,
  });
});

exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const user = await db.users.findByEmailWithPassword(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  res.json({
    success: true,
    message: "Login successful",
    token: generateToken(user),
    user,
  });
});

exports.getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  ["name", "phone", "businessName"].forEach((k) => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });

  const user = await db.users.updateById(req.user._id, updates);
  res.json({ success: true, user });
});
