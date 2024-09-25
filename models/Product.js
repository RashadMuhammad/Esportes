const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productNo: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true,
    unique:true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  stock: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  images: {
    type: [String],  // Array of image paths
    required: false
  },
  listed: {
    type: Boolean,
    default: true
  }
},{timestamps:true});

module.exports = mongoose.model('Product', productSchema);
