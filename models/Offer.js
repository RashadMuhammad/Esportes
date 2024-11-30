const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['product', 'category', 'referral'],
    required: true
  },
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    validate: {
      validator: function() { return this.type === 'product' ? !!this.product : true; },
      message: 'Product is required for product-based offers.'
    }
  },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category',
    validate: {
      validator: function() { return this.type === 'category' ? !!this.category : true; },
      message: 'Category is required for category-based offers.'
    }
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  maxDiscountValue: {
    type: Number,
  },
  minProductPrice: { 
    type: Number,
    // required: true
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.validFrom;
      },
      message: 'validUntil must be greater than validFrom.'
    }
  },
  referralBonus: {
    referrer: { type: Number },
    referee: { type: Number },
  },
  status: {
    type: String,
    enum: ['active', 'expired'],
    default: 'active'
  }
});

module.exports = mongoose.model('Offer', offerSchema);
