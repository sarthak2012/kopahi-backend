/*
 * Leads repository.
 * Only file allowed to import the Lead Mongoose model.
 */

const Lead = require("../models/Lead");

const create = (data) => Lead.create(data);

const list = ({ sort = { createdAt: -1 } } = {}) => Lead.find().sort(sort);

const count = (filter = {}) => Lead.countDocuments(filter);

module.exports = { create, list, count };
