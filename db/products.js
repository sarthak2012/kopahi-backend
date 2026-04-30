/*
 * Products repository.
 * Only file allowed to import the Product Mongoose model.
 * Returned documents support .save() / Object.assign() so callers can mutate
 * and persist — when migrating to Postgres, expose a small `update(doc)` helper
 * here and have callers use it instead of `.save()`.
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

module.exports = {
  findById,
  findByIds,
  create,
  list,
  findFeatured,
  count,
  deleteById,
};
