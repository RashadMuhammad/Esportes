const Category = require("../../models/Category");
const Product = require("../../models/Product");
const Offer = require("../../models/Offer");
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


// Render offers page
exports.renderOffers = async (req, res) => {
    try {
      const offers = await Offer.find()
        .populate("product", "name") 
        .populate("category", "name") 
        .exec();
  
      // Fetch products and categories
      const products = await Product.find();
      const categories = await Category.find();
  
      // Render the offers page with the fetched offers, products, and categories
      res.render("admin/offers", { offer: offers, offers, products, categories });
    } catch (err) {
      console.error("Error fetching offers:", err);
      res.status(500).send("Internal Server Error");
    }
  };
  
  exports.addOffer = async (req, res) => {
    try {
      const {
        offerType,
        productName,
        categoryName,
        discountType,
        discountValue,
        maxDiscountValue,
        validFrom,
        validUntil,
        minProductPrice,
        referrerBonus,
        refereeBonus,
      } = req.body;
  
      const offers = await Offer.find()
        .populate("product", "name") // Only fetch the product name
        .populate("category", "name") // Only fetch the category name
        .exec();
  
      // Fetch products and categories
      const products = await Product.find();
      const categories = await Category.find();
  
      if (minProductPrice < 0) {
        return res.render("admin/offers", {offer: offers, offers, products, categories, message: "Minimum product price cannot be negative." });
      }
  
      if (offerType === "product") {
        const product = await Product.findOne({ name: productName });
        if (!product) {
          return res.render("admin/offers", { offer: offers, offers, products, categories,message: "Product not found." });
        }
  
        if (discountType === "fixed") {
          if (discountValue > product.price) {
            return res.render("admin/offers", { offer: offers, offers, products, categories,message: "Discount value cannot be greater than product price." });
          }
        } else if (discountType === "percentage") {
          if (discountValue > 80) {
            return res.render("admin/offers", { offer: offers, offers, products, categories,message: "Percentage discount cannot exceed 80%." });
          }
        }
      } else if (offerType === "category") {
        const category = await Category.findOne({ name: categoryName });
        if (!category) {
          return res.render("admin/offers", { offer: offers, offers, products, categories,message: "Category not found." });
        }
  
        const productsInCategory = await Product.find({ category: category._id });
        const minPrice = Math.min(...productsInCategory.map(p => p.price));
  
        if (discountType === "fixed") {
          if (minProductPrice <= discountValue) {
            return res.render("admin/offers", { offer: offers, offers, products, categories,message: "Minimum product price must be greater than discount value." });
          }
        } else if (discountType === "percentage") {
          if (discountValue > 80) {
            return res.render("admin/offers", { offer: offers, offers, products, categories,message: "Percentage discount cannot exceed 80%." });
          }
        }
      }
  
      const currentDate = new Date();
      currentDate.setHours(23, 59, 59, 999);
  
      const validFromDate = new Date(validFrom);
      validFromDate.setHours(23, 59, 59, 999);
  
      if (validFromDate < currentDate) {
        return res.render("admin/offers", { offer: offers, offers, products, categories,message: "Valid From date cannot be in the past." });
      }
  
      const validUntilDate = new Date(validUntil);
      if (validUntilDate <= validFromDate) {
        return res.render("admin/offers", {offer: offers, offers, products, categories, message: "Valid Until date must be after Valid From date." });
      }
  
      const newOffer = new Offer({
        type: offerType,
        discountType,
        discountValue,
        maxDiscountValue,
        validFrom,
        validUntil,
        minProductPrice,
        referrerBonus,
        refereeBonus,
      });
  
      if (offerType === "product") {
        newOffer.product = (await Product.findOne({ name: productName }))._id;
      } else if (offerType === "category") {
        newOffer.category = (await Category.findOne({ name: categoryName }))._id;
      }
  
      await newOffer.save();
      res.redirect("/admin/offers");
    } catch (error) {
      console.error(error);
      return res.render("admin/offers", { message: "Server error" });
    }
  };
  
  exports.editmodalof = async (req, res) => {
    try {
      const offer = await Offer.findById(req.params.id)
        .populate("product", "name")
        .populate("category", "name");
  
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
  
      res.json(offer);
    } catch (error) {
      console.error("Error fetching offer data:", error);
      res.status(500).json({ message: "Error fetching offer data" });
    }
  };
  
  // Controller for updating an offer
  exports.updateOffer = async (req, res) => {
    try {
      const {
        type,
        discountType,
        discountValue,
        maxDiscountValue,
        validFrom,
        validUntil,
        minProductPrice,
        product,
        category,
      } = req.body;
  
      if (!product && !category) {
        return res
          .status(400)
          .json({ message: "Please select either a product or a category." });
      }
  
      if (maxDiscountValue > minProductPrice) {
        return res.status(400).json({
          message: "Max Discount Value cannot exceed Min Product Price.",
        });
      }
  
      const updateData = {
        type,
        discountType,
        discountValue,
        maxDiscountValue,
        validFrom,
        validUntil,
        minProductPrice,
        product: product || undefined,
        category: category || undefined,
      };
  
  
      
      
      const updatedOffer = await Offer.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );
  
      if (!updatedOffer) {
        return res.status(404).json({ message: "Offer not found" });
      }
  
      res.json(updatedOffer);
    } catch (error) {
      console.error("Error updating offer:", error);
      res.status(500).json({ message: "Error updating offer" });
    }
  };
  
  // Listing and Unlisting Offers
  exports.unlistOffers = async (req, res) => {
    try {
      const offerId = req.params.id;
      const newStatus = req.body.status;
  
      // Update the offer's status
      const updatedOffer = await Offer.findByIdAndUpdate(
        offerId,
        { status: newStatus },
        { new: true }
      );
  
      res.json(updatedOffer);
    } catch (error) {
      res.status(500).json({ message: "Error updating offer status" });
    }
  };
  
  // Controller method to delete the offer
  exports.deleteOffer = async (req, res) => {
    try {
      await Offer.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Offer deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting offer" });
    }
  };
  