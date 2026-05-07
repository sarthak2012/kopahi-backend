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

const findByPasswordResetToken = (tokenHash) =>
  User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

const findByEmailVerificationToken = (tokenHash) =>
  User.findOne({
    emailVerificationToken: tokenHash,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationToken +emailVerificationExpires");

const create = (data) => User.create(data);

const updateById = (id, updates) =>
  User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

const deleteById = (id) => User.findByIdAndDelete(id);

const list = (filter = {}, { sort = { createdAt: -1 } } = {}) =>
  User.find(filter).sort(sort);

const count = (filter = {}) => User.countDocuments(filter);

const setPasswordResetToken = (id, tokenHash, expires) =>
  User.findByIdAndUpdate(id, {
    passwordResetToken: tokenHash,
    passwordResetExpires: expires,
  });

const clearPasswordResetToken = (id, newPasswordHash) =>
  User.findByIdAndUpdate(id, {
    password: newPasswordHash,
    $unset: { passwordResetToken: "", passwordResetExpires: "" },
  });

const setEmailVerificationToken = (id, tokenHash, expires) =>
  User.findByIdAndUpdate(id, {
    emailVerificationToken: tokenHash,
    emailVerificationExpires: expires,
    emailVerified: false,
  });

const markEmailVerified = (id) =>
  User.findByIdAndUpdate(
    id,
    {
      emailVerified: true,
      $unset: { emailVerificationToken: "", emailVerificationExpires: "" },
    },
    { new: true }
  );

const updatePassword = (id, hashed) =>
  User.findByIdAndUpdate(id, { password: hashed });

const getWishlist = (id) =>
  User.findById(id).populate("wishlist").select("wishlist");

const addToWishlist = (id, productId) =>
  User.findByIdAndUpdate(id, { $addToSet: { wishlist: productId } }, { new: true });

const removeFromWishlist = (id, productId) =>
  User.findByIdAndUpdate(id, { $pull: { wishlist: productId } }, { new: true });

const getCart = (id) =>
  User.findById(id).populate("cart.product").select("cart");

const replaceCart = (id, items) =>
  User.findByIdAndUpdate(id, { cart: items }, { new: true });

const clearCart = (id) =>
  User.findByIdAndUpdate(id, { cart: [] }, { new: true });

module.exports = {
  findById,
  findByIdWithPassword,
  findByEmail,
  findByEmailWithPassword,
  findByPasswordResetToken,
  findByEmailVerificationToken,
  create,
  updateById,
  deleteById,
  list,
  count,
  setPasswordResetToken,
  clearPasswordResetToken,
  setEmailVerificationToken,
  markEmailVerified,
  updatePassword,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getCart,
  replaceCart,
  clearCart,
};
