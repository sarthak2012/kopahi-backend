const BlogPost = require("../models/BlogPost");

const findBySlug = (slug) => BlogPost.findOne({ slug });

const findById = (id) => BlogPost.findById(id);

const listPublished = async ({ page = 1, pageSize = 12 } = {}) => {
  const safeSize = Math.min(Math.max(Number(pageSize) || 12, 1), 50);
  const safePage = Math.max(Number(page) || 1, 1);
  const filter = { published: true };
  const [count, items] = await Promise.all([
    BlogPost.countDocuments(filter),
    BlogPost.find(filter)
      .sort({ publishedAt: -1 })
      .skip(safeSize * (safePage - 1))
      .limit(safeSize),
  ]);
  return { count, page: safePage, pages: Math.ceil(count / safeSize) || 1, items };
};

const listAll = ({ sort = { publishedAt: -1 } } = {}) => BlogPost.find().sort(sort);

const create = (data) => BlogPost.create(data);

const updateById = (id, updates) =>
  BlogPost.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

const deleteById = (id) => BlogPost.findByIdAndDelete(id);

module.exports = { findBySlug, findById, listPublished, listAll, create, updateById, deleteById };
