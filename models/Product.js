const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productNo: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true,
    unique: true
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
  discountedPrice: {
    type: Number,  // New field to store the discounted price
    required: false // This can be optional; set to true if you want it to be mandatory
  },
  images: {
    type: [String],  
    required: false
  },
  listed: {
    type: Boolean,
    default: true
  },
  popularity: {
    type: Number,
    default: 0  // Can be used to sort by popularity
  },
  rating: {
    type: Number,
    default: 0  // Can be used to sort by average rating
  },
  isFeatured: {
    type: Boolean,
    default: false  // Used to identify featured products
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
