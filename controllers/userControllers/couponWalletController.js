const User = require("../../models/user");
const Cart = require("../../models/Cart");
const Coupon = require("../../models/Coupon");
const Wallet = require("../../models/Wallet");
require("dotenv").config();


exports.getAvailableCoupons = async (req, res) => {
    try {
      const userId = req.session.userId || req.session.passport?.user;
  
      const coupons = await Coupon.find({
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
        $nor: [{ appliedUsers: userId }],
      });
  
      const couponData = coupons.map((coupon) => ({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        description: coupon.description || "No description available",
      }));
  
      res.json(couponData);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).send("Server Error");
    }
  };

  exports.applyCoupon = async (req, res) => {
    const { couponCode } = req.body;
    const userId = req.session.userId || req.session.passport?.user;
  
    try {
      const coupon = await Coupon.findOne({ code: couponCode });
  
      // Check if the coupon exists and is active
      if (
        !coupon ||
        !coupon.isActive ||
        coupon.validUntil < new Date() ||
        coupon.validFrom > new Date()
      ) {
        return res.json({
          isValid: false,
          message: "Invalid or expired coupon.",
        });
      }
  
      // Check if the user has already applied this coupon
      if (coupon.appliedUsers.includes(userId)) {
        return res.json({
          isValid: false,
          message: "Coupon has already been used by this user.",
        });
      }
  
      // Check usage limit
      if (
        coupon.usageLimit === 0 &&
        coupon.appliedUsers.length >= coupon.usageLimit
      ) {
        return res.json({
          isValid: false,
          message: "Coupon usage limit reached.",
        });
      }
  
  
  
      // Return coupon data to frontend if all checks pass
      res.json({
        isValid: true,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountValue: coupon.maxDiscountValue || null,
        minCartValue: coupon.minCartValue,
      });
  
      await coupon.save();
    } catch (error) {
      console.error("Error applying coupon:", error);
      res.status(500).json({ isValid: false, message: "Server error" });
    }
  };

//Wallet Page
exports.getWallet = async (req, res) => {
    try {
      const userId = req.session.userId || req.session.passport?.user;
  
      const isAuthenticated = userId ? true : false;
  
      const wallet = await Wallet.findOne({ userId });
  
      if (!wallet) {
        return res.render("users/userwallet", {
          walletBalance: 0,
          transactions: [],
          isAuthenticated,
          cartProductCount: 0,
          wishlistCount: 0,
          message: "No wallet found for the user",
        });
      }
  
      // Fetch cart product count
      let cartProductCount = 0;
      if (isAuthenticated) {
        const cart = await Cart.findOne({ userId });
        if (cart) {
          cartProductCount = cart.items.length;
        }
      }

  
      // Fetch wishlist count
      const user = await User.findById(userId);
      let wishlistCount = 0;
      if (user && user.wishlist) {
        wishlistCount = user.wishlist.length;
      }
  
      res.render("users/userwallet", {
        user,
        walletBalance: wallet.balance,
        transactions: wallet.transactions,
        isAuthenticated,
        cartProductCount,
        wishlistCount,
      });
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).send("Server error");
    }
  };

  exports.removeCoupon = async (req, res) => {
    const { couponCode } = req.body;
    const userId = req.session.userId || req.session.passport?.user;
  
    try {
      const coupon = await Coupon.findOne({ code: couponCode });
  
      if (!coupon) {
        return res.status(400).json({ message: "Coupon not found." });
      }
  
      await Coupon.updateOne(
        { code: couponCode },
        { $pull: { appliedUsers: userId } }
      );
  
      const user = await User.findById(userId);
      if (user && user.appliedCoupons) {
        user.appliedCoupons = user.appliedCoupons.filter(
          (code) => code !== couponCode
        );
        await user.save();
      }
  
      res.json({
        success: true,
        message: "Coupon removed successfully.",
      });
    } catch (error) {
      console.error("Error removing coupon:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };



