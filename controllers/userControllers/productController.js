const User = require("../../models/user");
const Category = require("../../models/Category");
const Product = require("../../models/Product");
const Cart = require("../../models/Cart");
const Offer = require("../../models/Offer");
require("dotenv").config();

//Product Details Page
exports.productDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const isAuthenticated =
      req.session.userId ||
      req.session.passport?.user
        ? true
        : false;

    res.json(product, isAuthenticated);
  } catch (error) {
    res.status(500).send("Server error");
  }
};

// Product Page
exports.product = async (req, res) => {
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

    const isAuthenticated =
      req.session.userId || req.session.passport?.user ? true : false;

    for (const product of products) {
      const applicableOffers = activeOffers.filter((offer) => {
        return (
          (offer.type === "product" &&
            offer?.product?.toString() === product?._id?.toString() &&
            product.price >= offer.minProductPrice) ||
          (offer.type === "category" &&
            offer?.category?.toString() ===
              product?.category?._id?.toString() &&
            product.price >= offer.minProductPrice)
        );
      });

      let discountedPrice = product.price;
      let bestOffer = null;

      if (applicableOffers.length > 0) {
        // Find the best offer with the highest discount
        bestOffer = applicableOffers.reduce((prevOffer, currentOffer) => {
          const prevDiscount = calculateDiscount(prevOffer, product.price);
          const currentDiscount = calculateDiscount(
            currentOffer,
            product.price
          );
          return currentDiscount > prevDiscount ? currentOffer : prevOffer;
        });

        // Apply the best offer discount
        discountedPrice = applyBestOfferDiscount(bestOffer, product.price);

        discountedPrice = parseFloat(discountedPrice.toFixed(0));
      }

      product.discountedPrice = discountedPrice;
      product.bestOffer = bestOffer;

      // Update the product's discounted price in the database
      await Product.updateOne(
        { _id: product._id },
        { discountedPrice: discountedPrice }
      );
    }

    let cartProductCount = 0;
    let wishlistCount = 0;

    if (isAuthenticated) {
      const user = await User.findById(
        req.session.userId || req.session.passport?.user
      );
      const cart = await Cart.findOne({
        userId: req.session.userId || req.session.passport?.user,
      });
      wishlistCount = user.wishlist.length;

      if (cart) {
        cartProductCount = cart.items.length;
      }
    }

    res.render("users/product", {
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

// Search products route
exports.searchProducts = async (req, res) => {
  try {
    const query = req.query.q || "";
    const regex = new RegExp(query, "i");
    const products = await Product.find({
      $or: [
        { name: regex },
        { description: regex },
        { "category.name": regex },
      ],
    }).populate("category");

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error searching products" });
  }
};

// Helper function to calculate the discount for an offer
function calculateDiscount(offer, price) {
  return offer.discountType === "percentage"
    ? (offer.discountValue / 100) * price
    : offer.discountValue;
}

// Helper function to calculate discount
function calculateDiscount(offer, price) {
  if (offer.type === "product" || offer.type === "category") {
    if (offer.discountType === "fixed") {
      return offer.discountValue;
    } else if (offer.discountType === "percentage") {
      return (price * offer.discountValue) / 100;
    }
  }
  return 0;
}

// Helper function to apply the best offer discount
function applyBestOfferDiscount(offer, price) {
  let discountedPrice = price;
  if (offer.type === "product" || offer.type === "category") {
    if (offer.discountType === "fixed") {
      discountedPrice = price - offer.discountValue;
    } else if (offer.discountType === "percentage") {
      let discount = (price * offer.discountValue) / 100;
      if (offer.maxDiscountValue) {
        discount = Math.min(discount, offer.maxDiscountValue);
      }
      discountedPrice = price - discount;
    }
  }
  return discountedPrice.toFixed(0);
}

// Helper function to apply the best offer's discount to the product price
function applyBestOfferDiscount(offer, price) {
  return offer.discountType === "percentage"
    ? price - (offer.discountValue / 100) * price
    : price - offer.discountValue;
}

exports.productDetId = async (req, res) => {
  try {
    const productId = req.params.id;
    const categories = await Category.find();

    // Fetch the product including discountedPrice
    const product = await Product.findById(productId).populate("category");

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const isAuthenticated =
      req.session.userId || req.session.passport?.user ? true : false;

    let cartProductCount = 0;
    if (isAuthenticated) {
      const cart = await Cart.findOne({
        userId: req.session.userId || req.session.passport?.user,
      });
      if (cart) {
        cartProductCount = cart.items.length;
      }
    }

    const user = await User.findById(
      req.session.userId || req.session.passport?.user
    );
    const wishlistCount = user ? user.wishlist.length : 0;

    // Render the 'product-detail' view and pass the product data
    res.render("users/product-detail", {
      product,
      categories,
      isAuthenticated,
      cartProductCount,
      wishlistCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// Advanced search with filters and sorting
exports.advancedSearch = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const sortBy = req.query.sortBy || "default";

    let sortOptions = {};
    if (sortBy === "popularity") {
      sortOptions.popularity = -1;
    } else if (sortBy === "priceLowToHigh") {
      sortOptions.price = 1;
    } else if (sortBy === "priceHighToLow") {
      sortOptions.price = -1;
    } else if (sortBy === "averageRating") {
      sortOptions.rating = -1;
    } else if (sortBy === "newArrivals") {
      sortOptions.createdAt = -1;
    }

    const products = await Product.find({
      name: { $regex: searchQuery, $options: "i" },
    }).sort(sortOptions);

    // Send JSON response to the client
    res.json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

exports.categoryFilter = async (req, res) => {
  const categoryId = req.params.id;

  const products = await Product.find({ category: categoryId });

  const isAuthenticated =
    req.session.userId || req.session.passport.user || req.session.passport?.user
      ? true
      : false;

  let cartProductCount = 0;
  let wishlistCount = 0;

  if (isAuthenticated) {
    const user = await User.findById(
      req.session.userId || req.session.passport?.user
    );
    const cart = await Cart.findOne({
      userId: req.session.userId || req.session.passport?.user,
    });
    wishlistCount = user.wishlist.length;

    if (cart) {
      cartProductCount = cart.items.length;
    }
  }

  // Respond with JSON data
  res.json({ products, isAuthenticated, cartProductCount, wishlistCount });
};
