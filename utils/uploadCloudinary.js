const multer = require("multer");
const path = require("path");

const haveCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let storage;

if (haveCloudinary) {
  const { CloudinaryStorage } = require("multer-storage-cloudinary");
  const cloudinary = require("../config/cloudinary");

  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "kopahi-products",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    },
  });
} else {
  console.warn("[upload] Cloudinary env not set — falling back to local disk uploads");
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/products/"),
    filename: (req, file, cb) =>
      cb(
        null,
        `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
      ),
  });
}

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

module.exports.usingCloudinary = haveCloudinary;
