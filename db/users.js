/*
 * Users repository.
 * The only file in the codebase that talks to the User Mongoose model.
 * To migrate to Postgres: replace the body of each function with the
 * equivalent pg/Prisma/Drizzle call. The exported signatures must stay the same.
 */

const User = require("../models/User");

const findById = (id) => User.findById(id);

const findByIdWithPassword = (id) => User.findById(id).select("+password");

const findByEmail = (email) =>
  User.findOne({ email: String(email || "").toLowerCase() });

const findByEmailWithPassword = (email) =>
  User.findOne({ email: String(email || "").toLowerCase() }).select("+password");

const create = (data) => User.create(data);

const updateById = (id, updates) =>
  User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

const deleteById = (id) => User.findByIdAndDelete(id);

const list = (filter = {}, { sort = { createdAt: -1 } } = {}) =>
  User.find(filter).sort(sort);

const count = (filter = {}) => User.countDocuments(filter);

module.exports = {
  findById,
  findByIdWithPassword,
  findByEmail,
  findByEmailWithPassword,
  create,
  updateById,
  deleteById,
  list,
  count,
};
