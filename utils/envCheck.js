const logger = require("./logger");

/*
 * Validate critical environment variables on boot. Refuse to start in
 * production if any required value is missing; warn loudly in development.
 */
const REQUIRED = ["JWT_SECRET", "MONGO_URI"];
const RECOMMENDED = ["FRONTEND_URL", "JWT_EXPIRES_IN"];

const checkEnv = () => {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  const weak = REQUIRED.filter(
    (k) => process.env[k] && /change_me|your_|placeholder/i.test(process.env[k])
  );
  const recMissing = RECOMMENDED.filter((k) => !process.env[k]);

  const isProd = process.env.NODE_ENV === "production";

  if (missing.length || weak.length) {
    logger.error("env_invalid", { missing, weak });
    if (isProd) {
      console.error("Refusing to start in production with missing/weak env vars.");
      process.exit(1);
    }
  }

  if (recMissing.length) {
    logger.warn("env_recommended_missing", { recMissing });
  }
};

module.exports = checkEnv;
