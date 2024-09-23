const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,  // Image file path or name
    required: false
  },
  isListed: {
    type: Boolean,
    default: true  // By default, the category is listed (visible to users)
  }
},
{ timestamps: true });  // Automatically adds createdAt and updatedAt fields

module.exports = mongoose.model('Category', categorySchema);
