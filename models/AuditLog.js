const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorEmail: String,
    actorRole: String,
    action: { type: String, required: true },
    targetType: String,
    targetId: String,
    metadata: { type: mongoose.Schema.Types.Mixed },
    ip: String,
    userAgent: String,
    requestId: String,
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
