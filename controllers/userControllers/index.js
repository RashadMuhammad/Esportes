const User = require("../../models/user");
const Category = require("../../models/Category");
const Product = require("../../models/Product");
const Cart = require("../../models/Cart");
const Offer = require("../../models/Offer");
require("dotenv").config();



exports.about = async (req, res) => {
    try {
      
      const userId = req.session.userId || req.session.passport.user;
      const isAuthenticated = req.session.userId || req.session.passport.user? true : false;
      let wishlistCount = 0;
      let cartProductCount = 0;
  
      // Fetch user if authenticated
      let user;
      if (isAuthenticated) {
        user = await User.findById(userId);
  
        // Fetch wishlist count if user exists and has a wishlist
        if (user && user.wishlist) {
          wishlistCount = user.wishlist.length;
        }
  
        // Fetch cart product count
        const cart = await Cart.findOne({ userId });
        if (cart) {
          cartProductCount = cart.items.length;
        }
      }
  
  
      res.render("users/about", {
        isAuthenticated,
        cartProductCount,
        wishlistCount,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // Render home page
exports.home = async (req, res) => {
    try {
      const categories = await Category.find();
      const products = await Product.find({ listed: true })
        .populate("category")
        .exec();
  
      // Fetch active offers
      const currentDate = new Date();
      const activeOffers = await Offer.find({
        status: "active",
        validFrom: { $lte: currentDate },
        validUntil: { $gte: currentDate },
      });
  
      // Apply offers to products
      for (const product of products) {
        const applicableOffers = activeOffers.filter((offer) => {
          return (
            (offer.type === "product" &&
              offer.product.toString() === product._id.toString() &&
              product.price >= offer.minProductPrice) ||
            (offer.type === "category" &&
              offer.category.toString() === product.category._id.toString() &&
              product.price >= offer.minProductPrice)
          );
        });
  
        if (applicableOffers.length > 0) {
          const bestOffer = applicableOffers[0];
          let discount = 0;
  
          if (bestOffer.discountType === "percentage") {
            discount = (product.price * bestOffer.discountValue) / 100;
          } else if (bestOffer.discountType === "fixed") {
            discount = bestOffer.discountValue;
          }
  
          // Apply max discount limit
          if (bestOffer.maxDiscountAmount) {
            discount = Math.min(discount, bestOffer.maxDiscountAmount);
          }
  
          // Calculate discounted price
          const discountedPrice = (product.price - discount).toFixed(2);
          product.discountedPrice = discountedPrice;
  
          // Save discounted price in the database
          await Product.updateOne(
            { _id: product._id },
            { discountedPrice: discountedPrice }
          );
        } else {
          product.discountedPrice = null;
          await Product.updateOne(
            { _id: product._id },
            { discountedPrice: null }
          );
        }
      }
  
      const isAuthenticated = req.session.userId || req.session.passport.user ? true : false;
  
      let cartProductCount = 0;
      if (isAuthenticated) {
        const cart = await Cart.findOne({ userId: req.session.userId || req.session.passport.user  });
        if (cart) {
          cartProductCount = cart.items.length;
        }
      }
  
      let wishlistCount = 0;
  
      const user = await User.findById(req.session.userId || req.session.passport.user);
      if (user && user.wishlist) {
        wishlistCount = user.wishlist.length;
      }
  
      res.render("users/index", {
        categories,
        products,
        isAuthenticated,
        cartProductCount,
        wishlistCount,
      });
    } catch (error) {
      res.status(500).send("Server Error");
    }
  };

  exports.advancedHomeSearch = async (req, res) => {
    try {
      let { sortBy } = req.query;
  
      let sortCondition = {};
  
      switch (sortBy) {
        case "popularity":
          sortCondition = { popularity: -1 };
          break;
        case "priceLowToHigh":
          sortCondition = { price: 1 };
          break;
        case "priceHighToLow":
          sortCondition = { price: -1 };
          break;
        case "averageRating":
          sortCondition = { rating: -1 };
          break;
        case "newArrivals":
          sortCondition = { createdAt: -1 };
          break;
        case "featured":
          sortCondition = { isFeatured: -1 };
          break;
        case "aToZ":
          sortCondition = { name: 1 };
          break;
        case "zToA":
          sortCondition = { name: -1 };
          break;
        default:
          sortCondition = {};
      }
  
      const products = await Product.find({}).sort(sortCondition);
      const categories = await Category.find({ isListed: true });
      const isAuthenticated = req.session.userId || req.session.passport.user ? true : false;
  
      res.render("users/index", { products, categories, isAuthenticated });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  };

  exports.getCategories = async (req, res) => {
    try {
      const categories = await Category.find({ isListed: true }); 
      res.render("users/index", { categories });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching categories");
    }
  };
  