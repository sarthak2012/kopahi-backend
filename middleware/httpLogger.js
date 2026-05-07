const logger = require("../utils/logger");

const httpLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const fields = {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.ip,
      userId: req.user?._id?.toString(),
    };
    if (res.statusCode >= 500) logger.error("http", fields);
    else if (res.statusCode >= 400) logger.warn("http", fields);
    else logger.info("http", fields);
  });

  next();
};

module.exports = httpLogger;
