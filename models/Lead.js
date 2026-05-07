const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
{
  name: String,
  email: String,
  phone: String,
  message: String,

  source: {
    type: String,
    default: "Website"
  },

  status: {
    type: String,
    default: "New"
  },

  emailDelivered: {
    type: Boolean,
    default: false
  },

  emailError: {
    type: String,
    default: ""
  }
},
{ timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);