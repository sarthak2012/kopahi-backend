const multer = require("multer");
const path = require("path");
const fs = require("fs");

const dest = path.join(__dirname, "..", "uploads", "products");
if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dest),
  filename: (req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    ),
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpg|jpeg|png|webp/i;
  const extOk = allowed.test(path.extname(file.originalname));
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed"));
};

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});
