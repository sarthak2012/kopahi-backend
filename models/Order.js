const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      },

      name: String,
      image: String,
      price: Number,
      quantity: Number
    }
  ],

  shippingAddress: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: "India"
    }
  },

  paymentMethod: {
    type: String,
    default: "COD"
  },

  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending"
  },

  orderStatus: {
    type: String,
    enum: [
      "Placed",
      "Processing",
      "Packed",
      "Shipped",
      "Delivered",
      "Cancelled"
    ],
    default: "Placed"
  },

  itemsPrice: {
    type: Number,
    default: 0
  },

  shippingPrice: {
    type: Number,
    default: 0
  },

  taxPrice: {
    type: Number,
    default: 0
  },

  totalPrice: {
    type: Number,
    required: true
  },

  paidAt: Date,
  deliveredAt: Date
},
{ timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);