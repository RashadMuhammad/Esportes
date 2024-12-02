const User = require("../../models/user");
const Category = require("../../models/Category");
const Product = require("../../models/Product");
const Cart = require("../../models/Cart");
require("dotenv").config();

// Route to add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const productId = req.body.productId;

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const user = await User.findById(req.session.userId || req.session.passport.user);

    if (user.wishlist.includes(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Product already in wishlist" });
    }

    user.wishlist.push(productId);
    await user.save();

    const wishlistCount = user.wishlist.length;

    res.json({
      success: true,
      message: "Product added to wishlist",
      wishlistCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const userId = req.session.userId || req.session.passport.user;

    const isAuthenticated = userId ? true : false;

    const user = await User.findById(userId).populate("wishlist").exec();

    if (!user) {
      return res.status(404).send("User not found");
    }

    const categories = await Category.find();

    let cartProductCount = 0;
    if (isAuthenticated) {
      const cart = await Cart.findOne({ userId });
      if (cart) {
        cartProductCount = cart.items.length;
      }
    }

    const wishlistCount = user.wishlist.length;

    res.render("users/wishlist", {
      wishlist: user.wishlist,
      isAuthenticated,
      categories,
      cartProductCount,
      wishlistCount,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).send("Error fetching wishlist");
  }
};

// DELETE route to remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  const productId = req.params.productId;
  const userId = req.session.userId || req.session.passport.user;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { wishlist: productId },
      },
      { new: true }
    );

    const wishlistCount = user.wishlist.length;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res
      .status(200)
      .json({ message: "Product removed from wishlist", wishlistCount });
  } catch (error) {
    console.error("Error removing product from wishlist:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
