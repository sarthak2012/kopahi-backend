/*
 * Categories repository.
 * Only file allowed to import the Category Mongoose model.
 */

const Category = require("../models/Category");

const findById = (id) => Category.findById(id);

const list = ({ sort = { name: 1 } } = {}) => Category.find().sort(sort);

const create = (data) => Category.create(data);

const deleteById = (id) => Category.findByIdAndDelete(id);

module.exports = { findById, list, create, deleteById };
