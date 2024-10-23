const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
            productOffer: { type: Number, default: 0 }, // Product-specific discount
            offerApplied: { type: Boolean, default: false }, // Track if offer was applied
        }
    ],
    paymentMethod: { type: String, enum: ['OnlinePayment', 'CashOnDelivery'], required: true },
    razorpayPaymentId: { type: String },
    address: {
        name: String,
        housename: String,
        location: String,
        city: String,
        state: String,
        zip: String,
        addressType: { type: String, enum: ['home', 'work', 'custom'] }
    },
    total: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },   //amount deducted by coupon
    couponDiscount: { type: Number, default: 0 }, 
    totalAfterDiscount: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Completed', 'Shipped', 'Delivered', 'Canceled', 'Returned', 'Return completed'], default: 'Pending' },
    placedAt: { type: Date, default: Date.now },
    returnReason: { type: String, default: "" },
    returnRequested: { type: Boolean, default: false },
    returnStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    couponsApplied: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }]
});

module.exports = mongoose.model('Order', orderSchema);
