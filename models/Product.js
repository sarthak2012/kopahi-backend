const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  name: String,

  rating: {
    type: Number,
    required: true,
    default: 5
  },

  comment: {
    type: String,
    required: true
  }
},
{ timestamps: true }
);

const productSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    required: true,
    unique: true
  },

  description: {
    type: String,
    required: true
  },

  shortDescription: {
    type: String,
    default: ""
  },

  brand: {
    type: String,
    default: "Kopahi"
  },

  category: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  originalPrice: {
    type: Number,
    default: 0
  },

  discount: {
    type: Number,
    default: 0
  },

  stock: {
    type: Number,
    default: 0
  },

  unit: {
    type: String,
    default: "kg"
  },

  images: [
    {
      type: String
    }
  ],

  featured: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  rating: {
    type: Number,
    default: 0
  },

  numReviews: {
    type: Number,
    default: 0
  },

  reviews: [reviewSchema],

  tags: [
    {
      type: String
    }
  ],

  seoTitle: String,
  seoDescription: String
},
{ timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);