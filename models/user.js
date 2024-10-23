const mongoose = require("mongoose");

const users = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: false
  },
  phone :  {
    type: String
  },
  status: {
    type: String,
    enum: ["active", "blocked"],
    default: "active",
  },
  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    }
  ],
  googleId: String,
});

module.exports = mongoose.model("User", users);
