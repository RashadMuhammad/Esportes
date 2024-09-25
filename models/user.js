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
    required: false,
  },
  status: {
    type: String,
    enum: ["active", "blocked"],
    default: "active",
  },
  googleId: String,
});

module.exports = mongoose.model("User", users);
