const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: { type: Number, required: true },
      productOffer: { type: Number, default: 0 }, // Product-specific discount
      offerApplied: { type: Boolean, default: false }, // Track if offer was applied
    },
  ],
  paymentMethod: {
    type: String,
    enum: ["OnlinePayment", "CashOnDelivery",'walletPayment'],
    required: true,
  },
  razorpayPaymentId: { type: String },
  razorpayOrderId:{ type:String},
  address: {
    name: String,
    housename: String,
    location: String,
    city: String,
    state: String,
    zip: String,
    addressType: { type: String, enum: ["home", "work", "custom"] },
  },
  total: { type: Number, required: true },     //        //product original price
  subtotal: { type: Number },                  //      //price after the offer if the product had offer
  afteroffer: { type: Number },                  //      //difference between product price and offer of product
  discountAmount: { type: Number, default: 0 },  //      //amount deducted by coupon
  totalAfterDiscount: { type: Number },          //      //amount of discounts offer discount + coupon discount
  paymentTotal: { type: Number },                 //     //Total to Payment
  status: {
    type: String,
    enum: [
      "Pending",
      "Completed",
      "Shipped",
      "Delivered",
      "Canceled",
      "Returned", 
      "Return completed",
      "Payment Failure"
    ],
    default: "Pending",
  },
  placedAt: { type: Date, default: Date.now },
  returnReason: { type: String, default: "" },
  returnRequested: { type: Boolean, default: false },
  returnStatus: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  couponsApplied: [{ type: mongoose.Schema.Types.ObjectId, ref: "Coupon" }],
});

module.exports = mongoose.model("Order", orderSchema);
