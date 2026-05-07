const Coupon = require("../models/Coupon");

const findByCode = (code) =>
  Coupon.findOne({ code: String(code || "").toUpperCase().trim() });

const findById = (id) => Coupon.findById(id);

const list = ({ sort = { createdAt: -1 } } = {}) => Coupon.find().sort(sort);

const create = (data) => Coupon.create(data);

const updateById = (id, updates) =>
  Coupon.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

const deleteById = (id) => Coupon.findByIdAndDelete(id);

const incrementUsage = (id) =>
  Coupon.findByIdAndUpdate(id, { $inc: { usedCount: 1 } }, { new: true });

module.exports = {
  findByCode,
  findById,
  list,
  create,
  updateById,
  deleteById,
  incrementUsage,
};
