const jwt = require("jsonwebtoken");

const generateToken = (user, expiresIn) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || "30d" }
  );

module.exports = generateToken;
