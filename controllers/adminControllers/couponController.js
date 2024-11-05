const Coupon = require("../../models/Coupon");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads/"); // Store images in the 'public/uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with timestamp
  },
});


// Render coupons page
exports.renderCoupons = async (req, res) => {
    try {
      const coupons = await Coupon.find();
  
      res.render("admin/coupons", { coupons });
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  // To handle coupon update
  exports.updateCoupon = async (req, res) => {
    try {
      
      const couponId = req.params.id;
  
      const {
        code,
        discountType,
        discountValue,
        minCartValue,
        maxDiscountValue,
        validFrom,
        validUntil,
        usageLimit,
      } = req.body;
  
      const updatedCoupon = await Coupon.findByIdAndUpdate(
        couponId,
        {
          code,
          discountType,
          discountValue,
          minCartValue,
          maxDiscountValue,
          validFrom,
          validUntil,
          usageLimit,
        },
        { new: true }
      );
  
      if (!updatedCoupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      res.redirect("/admin/coupons");
    } catch (error) {
      console.error("Error updating coupon:", error);
      res.status(500).json({ message: "Server error while updating coupon" });
    }
  };
  
  exports.deleteCoupon = async (req, res) => {
    try {
      const couponId = req.params.couponId;
  
      // Find and delete the coupon by ID
      const result = await Coupon.findByIdAndDelete(couponId);
  
      if (result) {
        
        res.redirect("/admin/coupons");
      } else {
        
        res.status(404).send("Coupon not found");
      }
    } catch (error) {
      console.error(`Error deleting coupon: ${error.message}`);
      res.status(500).send("Server error");
    }
  };
  
  exports.addCoupon = async (req, res) => {
    try {
      const {
        code,
        discountType,
        discountValue,
        minCartValue,
        maxDiscountValue,
        validFrom,
        validUntil,
        usageLimit,
        productPrice, // Pass the product price from the frontend or calculate it
      } = req.body;
  
      // Validate discountValue based on discountType
      if (discountType === "percentage") {
        if (discountValue < 1 || discountValue > 80) {
          return res
            .status(400)
            .send(
              "Discount value must be between 1% and 80% for percentage discount."
            );
        }
      } else if (discountType === "fixed") {
        if (discountValue >= minCartValue) {
          return res
            .status(400)
            .send(
              "Fixed discount value must be less than the minimum cart value."
            );
        }
      }
  
      // Create a new coupon object
      const newCoupon = new Coupon({
        code,
        discountType,
        discountValue,
        minCartValue: minCartValue || 0,
        maxDiscountValue: discountType === "percentage" ? maxDiscountValue : null, // Only store maxDiscountValue for percentage discounts
        validFrom,
        validUntil,
        usageLimit: usageLimit || 1,
      });
  
      await newCoupon.save();
  
      
  
      res.redirect("/admin/coupons");
    } catch (error) {
      console.error("Error adding new coupon:", error.message);
      res.status(500).send("Server error");
    }
  };
  