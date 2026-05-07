/*
 * Products repository.
 * Only file allowed to import the Product Mongoose model.
 */

const Product = require("../models/Product");

const findById = (id) => Product.findById(id);

const findByIds = (ids) => Product.find({ _id: { $in: ids } });

const create = (data) => Product.create(data);

const list = async (filter = {}, { page = 1, pageSize = 12, sort = { createdAt: -1 } } = {}) => {
  const safeSize = Math.min(Math.max(Number(pageSize) || 12, 1), 50);
  const safePage = Math.max(Number(page) || 1, 1);
  const [count, items] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .skip(safeSize * (safePage - 1))
      .limit(safeSize)
      .sort(sort),
  ]);
  return { count, page: safePage, pages: Math.ceil(count / safeSize) || 1, items };
};

const findFeatured = (limit = 8) =>
  Product.find({ featured: true, isActive: { $ne: false } }).limit(limit);

const count = (filter = {}) => Product.countDocuments(filter);

const deleteById = (id) => Product.findByIdAndDelete(id);

const updateById = (id, updates) =>
  Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

const decrementStock = (id, qty) =>
  Product.findOneAndUpdate(
    { _id: id, stock: { $gte: qty } },
    { $inc: { stock: -qty } },
    { new: true }
  );

const findByVendor = (vendorId, { sort = { createdAt: -1 } } = {}) =>
  Product.find({ vendor: vendorId }).sort(sort);

module.exports = {
  findById,
  findByIds,
  create,
  list,
  findFeatured,
  count,
  deleteById,
  updateById,
  decrementStock,
  findByVendor,
};
