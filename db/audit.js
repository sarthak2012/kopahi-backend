const AuditLog = require("../models/AuditLog");

const create = (data) => AuditLog.create(data);

const list = ({ page = 1, pageSize = 50, action, actor } = {}) => {
  const safeSize = Math.min(Math.max(Number(pageSize) || 50, 1), 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const filter = {};
  if (action) filter.action = action;
  if (actor) filter.actor = actor;
  return AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .skip(safeSize * (safePage - 1))
    .limit(safeSize)
    .populate("actor", "name email role");
};

const count = (filter = {}) => AuditLog.countDocuments(filter);

module.exports = { create, list, count };
