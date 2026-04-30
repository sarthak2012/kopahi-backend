/*
 * Orders repository.
 * Only file allowed to import the Order Mongoose model.
 * Postgres migration note: replace `.populate("user", ...)` calls with an
 * explicit JOIN in the underlying query and shape the returned object the
 * same way (order.user = { _id, name, email }).
 */

const Order = require("../models/Order");

const findById = (id) => Order.findById(id);

const findByIdWithUser = (id) =>
  Order.findById(id).populate("user", "name email");

const create = (data) => Order.create(data);

const findByUser = (userId, { sort = { createdAt: -1 } } = {}) =>
  Order.find({ user: userId }).sort(sort);

const listAll = ({ sort = { createdAt: -1 } } = {}) =>
  Order.find().populate("user", "name email").sort(sort);

const count = (filter = {}) => Order.countDocuments(filter);

const totalPaidRevenue = async () => {
  const agg = await Order.aggregate([
    { $match: { paymentStatus: "Paid" } },
    { $group: { _id: null, revenue: { $sum: "$totalPrice" } } },
  ]);
  return agg[0]?.revenue || 0;
};

module.exports = {
  findById,
  findByIdWithUser,
  create,
  findByUser,
  listAll,
  count,
  totalPaidRevenue,
};
