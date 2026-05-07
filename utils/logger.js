/*
 * Tiny structured logger. Emits one JSON line per call so logs can be parsed
 * by any aggregator (Loki, Datadog, CloudWatch). Falls back to pretty printing
 * in development.
 */

const pretty = process.env.NODE_ENV !== "production";

const emit = (level, fields) => {
  const record = {
    level,
    time: new Date().toISOString(),
    ...fields,
  };
  if (pretty) {
    const { msg, requestId, ...rest } = record;
    const tag = requestId ? ` [${String(requestId).slice(0, 8)}]` : "";
    const extra = Object.keys(rest).length ? " " + JSON.stringify(rest) : "";
    const fn = level === "error" ? "error" : level === "warn" ? "warn" : "log";
    console[fn](`${record.time} ${level.toUpperCase()}${tag} ${msg || ""}${extra}`);
  } else {
    process.stdout.write(JSON.stringify(record) + "\n");
  }
};

const logger = {
  debug: (msg, fields = {}) =>
    process.env.LOG_LEVEL === "debug" && emit("debug", { msg, ...fields }),
  info: (msg, fields = {}) => emit("info", { msg, ...fields }),
  warn: (msg, fields = {}) => emit("warn", { msg, ...fields }),
  error: (msg, fields = {}) => emit("error", { msg, ...fields }),
  child: (extra) => ({
    debug: (msg, fields = {}) => logger.debug(msg, { ...extra, ...fields }),
    info: (msg, fields = {}) => logger.info(msg, { ...extra, ...fields }),
    warn: (msg, fields = {}) => logger.warn(msg, { ...extra, ...fields }),
    error: (msg, fields = {}) => logger.error(msg, { ...extra, ...fields }),
  }),
};

module.exports = logger;
