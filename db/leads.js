/*
 * Leads repository.
 * Only file allowed to import the Lead Mongoose model.
 */

const Lead = require("../models/Lead");

const create = (data) => Lead.create(data);

const list = ({ sort = { createdAt: -1 } } = {}) => Lead.find().sort(sort);

const count = (filter = {}) => Lead.countDocuments(filter);

const updateById = (id, updates) =>
  Lead.findByIdAndUpdate(id, updates, { new: true });

const findUndelivered = () =>
  Lead.find({ emailDelivered: false }).sort({ createdAt: -1 });

module.exports = { create, list, count, updateById, findUndelivered };
