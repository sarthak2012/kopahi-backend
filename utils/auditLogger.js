const db = require("../db");
const logger = require("./logger");

/*
 * Record a destructive or otherwise notable action. Never throws — audit
 * failures must not break the user-facing operation.
 */
const recordAudit = async (req, { action, targetType, targetId, metadata }) => {
  try {
    await db.audit.create({
      actor: req.user?._id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      action,
      targetType,
      targetId: targetId ? String(targetId) : undefined,
      metadata,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: req.id,
    });
  } catch (err) {
    logger.error("audit_write_failed", {
      action,
      targetType,
      targetId,
      err: err.message,
      requestId: req.id,
    });
  }
};

module.exports = { recordAudit };
