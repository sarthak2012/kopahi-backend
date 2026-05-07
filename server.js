const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

dotenv.config();

const checkEnv = require("./utils/envCheck");
const logger = require("./utils/logger");
const requestId = require("./middleware/requestId");
const httpLogger = require("./middleware/httpLogger");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

checkEnv();
connectDB();

const app = express();

app.set("trust proxy", 1);

app.use(requestId);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(httpLogger);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API documentation (OpenAPI)
try {
  const openapi = YAML.load(path.join(__dirname, "openapi.yaml"));
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openapi, { customSiteTitle: "Kopahi API Docs" })
  );
  app.get("/api/openapi.json", (req, res) => res.json(openapi));
} catch (err) {
  logger.warn("openapi_load_failed", { err: err.message });
}

app.get("/", (req, res) => {
  res.json({ success: true, name: "Kopahi API", version: "1.0.0", docs: "/api/docs" });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, uptime: process.uptime(), env: process.env.NODE_ENV || "development" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/wishlist", require("./routes/wishlistRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/blog", require("./routes/blogRoutes"));
app.use("/api/coupons", require("./routes/couponRoutes"));
app.use("/api/vendor", require("./routes/vendorRoutes"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  logger.info("server_started", { port: PORT, env: process.env.NODE_ENV || "development" })
);
