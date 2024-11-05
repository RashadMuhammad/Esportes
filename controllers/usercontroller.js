const User = require("../models/user");
const Category = require("../models/Category");
const Address = require("../models/Address");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const Offer = require("../models/Offer");
const Wallet = require("../models/Wallet");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const crypto = require("crypto");
const { log } = require("console");
require("dotenv").config();

const Razorpay = require("razorpay");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Render signup page
exports.signup = async (req, res) => {
  try {
    res.render("users/signup");
  } catch (error) {
    console.error("Error rendering signup page:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Hash password
exports.securePassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    console.error("Error hashing password:", error.message);
    throw new Error("Password hashing failed");
  }
};

// Insert user and send OTP
exports.insertUser = async (req, res) => {
  const { username, password, email } = req.body;

  // Check for spaces in username and password
  if (/\s/.test(username) || /\s/.test(password)) {
    return res.render("users/signup", {
      message: "Username and Password cannot contain spaces",
    });
  }
  

  try {
    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("users/signup", {
        message: "Email already registered. Use a different email.",
      });
    }

    // Secure the password
    const hashedPassword = await exports.securePassword(password);

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999);
    const otpExpiration = Date.now() + 60000; // OTP valid for 1 minute

    // Store user info and OTP in session
    req.session.otp = otp;
    req.session.username = username;
    req.session.email = email;
    req.session.password = hashedPassword;
    req.session.otpExpiration = otpExpiration;

    // Send OTP via email
    await sendOtpEmail(email, otp);

    res.redirect("/otpverification");
  } catch (err) {
    console.error("Error during signup:", err.message);
    res.render("users/signup", {
      message: "An error occurred during signup. Please try again.",
    });
  }
};

// Function to send OTP via email
const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}`,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending OTP email:", error.message);
    throw new Error("Failed to send OTP email");
  }
};

// Render OTP verification page
exports.otpverification = (req, res) => {
  res.render("users/otpsign");
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  const { otp } = req.body;
  const currentTime = Date.now();

  try {
    // Check if OTP has expired
    if (currentTime > req.session.otpExpiration) {
      return res
        .status(400)
        .json({ message: "OTP expired. Please request a new OTP." });
    }

    // Verify OTP
    if (otp == req.session.otp) {
      // Create new user
      const newUser = new User({
        username: req.session.username,
        email: req.session.email,
        password: req.session.password,
      });

      const result = await newUser.save();
      if (result) {
        // Clear session and login user
        req.session.userId = result._id;
        clearSessionData(req);

        // Create a new cart for the user
        const cart = new Cart({
          userId: newUser._id,
          items: [],
          totalPrice: 0,
        });
        await cart.save();

        // Create a wallet for the user
        const wallet = new Wallet({
          userId: newUser._id,
          balance: 0,
        });
        await wallet.save();

        // Send success response
        return res.status(200).json({ message: "Success! User created." });
      } else {
        return res
          .status(400)
          .json({ message: "Failed to save user. Please try again." });
      }
    } else {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please try again." });
    }
  } catch (error) {
    console.error("Error during OTP verification:", error.message);
    res.status(500).json({
      message: "An error occurred during OTP verification. Please try again.",
    });
  }
};

// Clear session data after successful signup
const clearSessionData = (req) => {
  delete req.session.otp;
  delete req.session.username;
  delete req.session.email;
  delete req.session.password;
  delete req.session.otpExpiration;
};

// Resend OTP
exports.resendOtp = async (req, res) => {
  const { email } = req.session;
  if (!email) {
    return res.render("users/login", {
      message: "Session expired. Please log in again.",
    });
  }

  try {
    const otp = crypto.randomInt(100000, 999999); // Generate a new 6-digit OTP
    const otpExpiration = Date.now() + 60000; // OTP valid for 1 minute

    // Update OTP in session
    req.session.otp = otp;
    req.session.otpExpiration = otpExpiration;

    await sendOtpEmail(email, otp); // Resend OTP email
    res.redirect("/otpverification");

    // res.render("users/otpsign", { message: "A new OTP has been sent to your email." });
  } catch (error) {
    console.error("Error resending OTP:", error.message);
    res.render("users/otpsign", {
      message: "Failed to resend OTP. Please try again.",
    });
  }
};

// Render ForgetPassword Page
exports.forgetPassword = async (req, res) => {
  try {
    res.render("users/forgetpassword");
  } catch (error) {
    
  }
};

// Function to handle OTP request
exports.forgetPasswordOtp = async (req, res) => {
  const { email } = req.body;
  req.session.forgetEmail = email;

  if (!email) {
    return res.render("users/forgetpassword", { message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.render("users/forgetpassword", { message: "Email not found" });
    }

    const genotp = Math.floor(100000 + Math.random() * 900000);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Signup",
      text: `Your OTP for signup is ${genotp}. It will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    req.session.otp = genotp;
    req.session.email = email;
    req.session.otpExpires = Date.now() + 1 * 60 * 1000; 

    res.redirect("/forgetotppage");
  } catch (error) {
    console.error("Error during OTP sending:", error);
    return res.render("forgetPassword", {
      message: "Failed to send OTP email. Please try again later.",
    });
  }
};

//Render OTP Verify Page for Forget Password
exports.forgetOtpPage = async (req, res) => {
  try {
    const message = req.query.message;
    res.render("users/forgototp"), { msg: message };
  } catch (error) {
    
  }
};

exports.newPassword = async (req, res) => {
  try {
    if (req.session.forgetEmail) {
      res.render("users/newpassword");
    }
  } catch (error) {
    
  }
};

exports.resendForgetPasswordOtp = async (req, res) => {
  const email = req.session.forgetEmail;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    //=================================================================================
    const genotp = Math.floor(100000 + Math.random() * 900000);
    

    

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Signup",
      text: ` Your OTP for signup is ${genotp}. It will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    req.session.otp = genotp;
    req.session.email = req.body;
    req.session.otpExpires = Date.now() + 1 * 60 * 1000;

    res.redirect("/forgetotppage");
  } catch (error) {
    console.error("Error during dfffdfd OTP sending:", error);
    return res
      .status(500)
      .json({ error: "Failed to send OTP email rdgfhtrfghtrhftrfg" });
  }
};

// Assuming you're using express-session for session management
exports.forgetVerifyOtp = async (req, res) => {
  const { otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;
  const enteredOtp = otp1 + otp2 + otp3 + otp4 + otp5 + otp6;

  // Check if OTP exists in session
  if (!req.session.otp) {
    return res.status(400).json({
      success: false,
      message: "Session expired. Please request a new OTP.",
    });
  }

  // Check if OTP has expired
  if (Date.now() > req.session.otpExpires) {
    return res.status(400).json({
      success: false,
      message: "OTP expired. Please request a new one.",
    });
  }

  // Verify entered OTP
  if (parseInt(enteredOtp) === req.session.otp) {
    // Clear OTP session variables
    req.session.otp = null;
    req.session.otpExpires = null;
    req.session.otpCountdown = null;
    return res.status(200).json({ success: true });
  } else {
    return res
      .status(400)
      .json({ success: false, message: "Invalid OTP. Please try again." });
  }
};

exports.newpassVerify = async (req, res) => {
  try {
    const email = req.session.forgetEmail;
    const { password } = req.body;

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.render("users/newpassword", {
        message: "Email does not exist",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    await User.updateOne(
      { email: email },
      { $set: { password: hashPassword } }
    );

    req.session.forgetEmail = null;

    

    
    res.redirect("/login");
  } catch (error) {
    console.error("Error updating password:", error.message);
    res.send("Something went wrong. Please try again.");
  }
};

// Render login page
exports.login = async (req, res) => {
  try {
    res.render("users/login");
  } catch (error) {
    
    res.status(500).send("Server error");
  }
};

// Verify login
exports.verifylogin = async (req, res) => {
  const { email, password } = req.body;

  

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("users/login");
    }

    // Check if the user is blocked
    if (user.status === "blocked") {
      return res.render("users/login", {
        message: "Your account has been blocked. Please contact support.",
      });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("users/login", {
        message: "Incorrect Email or Password",
      });
    }
    req.session.userId = user._id;
    return res.redirect("/");
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).send("Internal Server Error");
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

    const isAuthenticated = req.session.userId ? true : false;

    let cartProductCount = 0;
    if (isAuthenticated) {
      const cart = await Cart.findOne({ userId: req.session.userId });
      if (cart) {
        cartProductCount = cart.items.length;
      }
    }

    let wishlistCount = 0;

    const user = await User.findById(req.session.userId);
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
    const isAuthenticated = req.session.userId ? true : false;

    res.render("users/index", { products, categories, isAuthenticated });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.shopingcart = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Check if the user is authenticated
    const isAuthenticated = !!userId;

    // Initialize cart and counts
    let cart = null;
    let cartProductCount = 0;
    let wishlistCount = 0;

    if (isAuthenticated) {
      cart = await Cart.findOne({ userId }).populate("items.productId");

      if (cart) {
        cartProductCount = cart.items.length;
        wishlistCount = (await User.findById(userId)).wishlist.length; // Fetch wishlist count
      }
    }

    // If the cart is empty, render the shopping cart page with zeros
    if (!cart || !cart.items.length) {
      return res.render("users/shoping-cart", {
        cart,
        subtotal: 0,
        discountAmount: 0,
        totalAfterDiscount: 0,
        isAuthenticated,
        cartProductCount,
        wishlistCount,
      });
    }

    let subtotal = 0;
    cart.items.forEach((item) => {
      const productPrice = item.productId.discountedPrice
        ? parseFloat(item.productId.discountedPrice)
        : parseFloat(item.productId.price);
      subtotal += productPrice * item.quantity;
    });

    const discountRate = 0.03;
    const discountAmount = subtotal * discountRate;
    const totalAfterDiscount = subtotal - discountAmount;

    res.render("users/shoping-cart", {
      cart,
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      totalAfterDiscount: totalAfterDiscount.toFixed(2),
      isAuthenticated,
      cartProductCount,
      wishlistCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.userId;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId: userId,
        items: [],
        totalPrice: 0,
      });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      if (
        existingItem.quantity + 1 > 5 ||
        existingItem.quantity + 1 > product.stock
      ) {
        return res.status(400).json({
          limitedStock: true,
          message: "Cannot add more than 5 items or not enough stock available",
        });
      }
      existingItem.quantity += 1;
    } else {
      
      if (1 > product.stock) {
        return res.status(400).send("Not enough stock available");
      }
      cart.items.push({ productId, quantity: 1 });
    }

    cart.totalPrice = await calculateTotalPrice(cart.items);

    // Save the updated cart
    await cart.save();
    const cartProductCount = await Cart.findOne({ userId });
    res.json({
      success: true,
      message: "item added successfully",
      cartProductCount: cartProductCount.items.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.session.userId;

    if (!quantity || isNaN(quantity) || quantity < 1 || quantity > 5) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const item = cart.items.find(
      (item) => item.productId.toString() === productId
    );
    if (!item) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    item.quantity = parseInt(quantity, 10);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const totalPriceForItem = product.price * item.quantity;
    cart.totalPrice = await calculateTotalPrice(cart.items);

    // Calculate subtotal, discount, and total after discount
    let subtotal = cart.items.reduce(
      (acc, item) => acc + item.productId.price * item.quantity,
      0
    );
    const discountRate = 0.03;
    const discountAmount = subtotal * discountRate;
    const totalAfterDiscount = subtotal - discountAmount;

    await cart.save();

    // Send back updated prices to update UI
    res.json({
      totalPrice: totalPriceForItem,
      subtotal,
      discountAmount,
      totalAfterDiscount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Helper function to calculate total price
async function calculateTotalPrice(items) {
  let total = 0;
  for (const item of items) {
    const product = await Product.findById(item.productId);
    total += product.price * item.quantity;
  }
  return total;
}

// Route to remove product from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.userId;

    const cart = await Cart.findOne({ userId });

    if (cart) {
      cart.items = cart.items.filter(
        (item) => item.productId.toString() !== productId
      );

      cart.totalPrice = await calculateTotalPrice(cart.items);

      await cart.save();
    }

    res.redirect("/shoping-cart");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isListed: true }); // Only fetch categories that are listed
    res.render("users/index", { categories });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching categories");
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
      // validFrom: { $lte: currentDate },
      // validUntil: { $gte: currentDate },
    });

    

    const isAuthenticated = req.session.userId ? true : false;

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
      const user = await User.findById(req.session.userId);
      const cart = await Cart.findOne({ userId: req.session.userId });
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

// Helper function to calculate the discount for an offer
function calculateDiscount(offer, price) {
  return offer.discountType === "percentage"
    ? (offer.discountValue / 100) * price
    : offer.discountValue;
}

// Helper function to apply the best offer's discount to the product price
function applyBestOfferDiscount(offer, price) {
  return offer.discountType === "percentage"
    ? price - (offer.discountValue / 100) * price
    : price - offer.discountValue;
}

exports.categoryFilter = async (req, res) => {
  
  const categoryId = req.params.id;
  
  
  const products = await Product.find({ category: categoryId });

  const isAuthenticated = req.session.userId ? true : false;

  let cartProductCount = 0;
  let wishlistCount = 0;

  if (isAuthenticated) {
    const user = await User.findById(req.session.userId);
    const cart = await Cart.findOne({ userId: req.session.userId });
    wishlistCount = user.wishlist.length;

    if (cart) {
      cartProductCount = cart.items.length;
    }
  }

  

  // Respond with JSON data instead of rendering a page
  res.json({ products, isAuthenticated, cartProductCount, wishlistCount });
};

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
  return discountedPrice.toFixed(2);
}

// Route to add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const productId = req.body.productId;

    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Find the logged-in user
    const user = await User.findById(req.session.userId);

    if (user.wishlist.includes(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Product already in wishlist" });
    }

    // Add the product to the user's wishlist
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
    const userId = req.session.userId;

    // Check if user is authenticated
    const isAuthenticated = userId ? true : false;

    // Find the user and populate their wishlist
    const user = await User.findById(userId).populate("wishlist").exec();

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Fetch categories
    const categories = await Category.find();

    // Fetch cart product count
    let cartProductCount = 0;
    if (isAuthenticated) {
      const cart = await Cart.findOne({ userId });
      if (cart) {
        cartProductCount = cart.items.length;
      }
    }

    // Fetch wishlist count
    const wishlistCount = user.wishlist.length;

    // Render the wishlist page
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
  const userId = req.session.userId;

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

//Product Details Page
exports.productDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const isAuthenticated = req.session.userId ? true : false;

    res.json(product, isAuthenticated);
  } catch (error) {
    res.status(500).send("Server error");
  }
};

// exports.productDet = async (req, res) => {
//   try {
//     const categories = await Category.find(); // Fetch all categories from MongoDB
//     const products = await Product.find({ listed: true })
//       .populate("category")
//       .exec();
//     // 

//     res.render("users/product-detail", { categories, products });
//   } catch (error) {
//     
//   }
// };

// Controller to get product details by ID

exports.productDetId = async (req, res) => {
  try {
    const productId = req.params.id;
    const categories = await Category.find();

    // Fetch the product including discountedPrice
    const product = await Product.findById(productId).populate("category");

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const isAuthenticated = req.session.userId ? true : false;

    let cartProductCount = 0;
    if (isAuthenticated) {
      const cart = await Cart.findOne({ userId: req.session.userId });
      if (cart) {
        cartProductCount = cart.items.length;
      }
    }

    const user = await User.findById(req.session.userId);
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

// Controller to render the logged-in user's profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.session.userId; // This contains the logged-in user's info

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    const isAuthenticated = req.session.userId ? true : false;

    // Fetch cart product count
    let cartProductCount = 0;
    if (isAuthenticated) {
      const cart = await Cart.findOne({ userId: req.session.userId });
      if (cart) {
        cartProductCount = cart.items.length;
      }
    }

    // Fetch wishlist count
    let wishlistCount = 0;
    if (user && user.wishlist) {
      wishlistCount = user.wishlist.length; // Count the items in the wishlist
    }

    // Render the profile page and pass the user data, cart count, and wishlist count to the EJS template
    res.render("users/userprofile", {
      user,
      isAuthenticated,
      cartProductCount,
      wishlistCount, // Add the wishlist count here
    });
  } catch (error) {
    
    res.status(500).send("An error occurred");
  }
};

exports.getAvailableCoupons = async (req, res) => {
  try {
    const userId = req.session.userId;

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

// Get all addresses of the logged-in user
exports.getaddresses = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Fetch user's addresses
    const addresses = await Address.find({ user: userId });
    

    const isAuthenticated = req.session.userId ? true : false;

    // Fetch cart product count
    let cartProductCount = 0;
    if (isAuthenticated) {
      const cart = await Cart.findOne({ userId: req.session.userId });
      if (cart) {
        cartProductCount = cart.items.length;
      }
    }

    // Fetch wishlist count
    let wishlistCount = 0;
    if (user && user.wishlist) {
      wishlistCount = user.wishlist.length;
    }

    // Render the user addresses page with all the required data
    res.render("users/useraddresses", {
      user,
      addresses,
      isAuthenticated,
      cartProductCount,
      wishlistCount, // Add the wishlist count here
    });
  } catch (error) {
    
    res.status(500).send("Server error");
  }
};

exports.addaddresses = async (req, res) => {
  try {
    const {
      name,
      housename,
      location,
      city,
      state,
      zip,
      landmark,
      addressType,
      customName,
    } = req.body;
    const userId = req.session.userId;

    const newAddress = new Address({
      user: userId,
      name,
      housename,
      location,
      city,
      state,
      zip,
      landmark,
      addressType,
      customName,
    });

    await newAddress.save();

    res.redirect("/addresses");
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).send("Server error");
  }
};

exports.editAddresses = async (req, res) => {
  try {
    const {
      id,
      name,
      housename,
      location,
      city,
      state,
      zip,
      landmark,
      addressType,
      customName,
    } = req.body;
    await Address.findByIdAndUpdate(id, {
      name,
      housename,
      location,
      city,
      state,
      zip,
      landmark,
      addressType,
      customName: addressType === "custom" ? customName : null,
    });
    res.redirect("/addresses");
  } catch (error) {
    
    res.status(500).send("Server error");
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const deletedAddress = await Address.findByIdAndDelete(addressId);

    if (!deletedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: "Password changed successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST route to handle profile update
exports.editProfile = async (req, res) => {
  const { username, email, phone } = req.body;

  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).send("User not found");
    }

    user.username = username;
    user.phone = phone;

    await user.save();

    res.redirect("/profile");
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send("An error occurred while updating the profile");
  }
};

exports.checkoutPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    const user = await User.findById(userId);
    const userAddresses = user.addresses || [];
    let subtotal = 0;

    const isAuthenticated = userId ? true : false;

    if (!cart || !cart.items.length) {
      req.flash("error", "Your cart is empty. Please add items to proceed.");
      return res.redirect("/shoping-cart");
    }

    for (const item of cart.items) {
      const product = item.productId;
      if (product.stock < item.quantity) {
        req.flash(
          "error",
          `Sorry, ${product.name} has only ${product.stock} items left in stock. Please adjust your quantity.`
        );
        return res.redirect("/shoping-cart");
      }
    }

    cart.items.forEach((item) => {
      subtotal += item.productId.discountedPrice
        ? item.productId.discountedPrice * item.quantity
        : item.productId.price * item.quantity;
    });

    subtotal = isNaN(subtotal) ? 0 : subtotal;

    const discountRate = 0.03;
    const discountAmount = subtotal * discountRate;
    const totalAfterDiscount = subtotal + discountAmount;

    const addresses = await Address.find({ user: userId });

    // Fetch cart product count
    let cartProductCount = 0;
    if (isAuthenticated) {
      const cartData = await Cart.findOne({ userId });
      if (cartData) {
        cartProductCount = cartData.items.length;
      }
    }

    // Fetch wishlist count
    const wishlistCount = user.wishlist.length;

    req.session.totalAmount = subtotal;

    res.render("users/checkout", {
      cart,
      userAddresses,
      addresses,
      subtotal,
      discountAmount: discountAmount.toFixed(2),
      totalAfterDiscount: totalAfterDiscount.toFixed(2),
      isAuthenticated,
      cartProductCount,
      wishlistCount,
    });
  } catch (error) {
    console.error("Error loading checkout page:", error);
    res.status(500).send("Internal Server Error");
  }
};

async function calculateTotalAfterOffers(cartItems) {
  try {
    // Fetch products from the database based on productIds
    const productIds = cartItems.map((item) => item.productId); // Extract productIds from cartItems
    const products = await Product.find({ _id: { $in: productIds } }); // Fetch products from DB

    // Fetch applicable offers for the products
    const offers = await Offer.find({
      $or: [
        {
          type: "product",
          product: { $in: productIds },
          status: "active",
          validUntil: { $gt: new Date() },
        },
        {
          type: "category",
          category: { $in: products.map((product) => product.category) },
          status: "active",
          validUntil: { $gt: new Date() },
        },
      ],
    });

    // Create a map of offers for easy access
    const offerMap = {};
    offers.forEach((offer) => {
      if (offer.type === "product") {
        offerMap[offer.product] = offer; // Store product offers by product ID
      } else if (offer.type === "category") {
        offerMap[offer.category] = offer; // Store category offers by category ID
      }
    });

    // Calculate the total price with discounts applied
    const totalAmountAfterOffers = cartItems.reduce((acc, item) => {
      const product = products.find((p) => p._id.toString() === item.productId); // Find product in fetched products
      if (product) {
        const offer = offerMap[item.productId] || offerMap[product.category]; // Check for product or category offer
        let applicablePrice = product.price; // Start with the regular price

        if (offer) {
          if (offer.discountType === "percentage") {
            const discount = (applicablePrice * offer.discountValue) / 100;
            applicablePrice -= discount; // Apply percentage discount
          } else if (offer.discountType === "fixed") {
            applicablePrice -= offer.discountValue; // Apply fixed discount
          }
        }

        return acc + applicablePrice * item.quantity; // Multiply the applicable price by quantity and accumulate
      }
      return acc; // If product not found, return accumulated total
    }, 0);

    
    return totalAmountAfterOffers; // Return or use totalAmountAfterOffers as needed
  } catch (error) {
    console.error("Error calculating total amount after offers:", error);
    throw error; // Handle error as needed
  }
}

exports.fetchProducts = async (req, res) => {
  const { productIds } = req.body;

  try {
    const products = await Product.find({ _id: { $in: productIds } }).select(
      "_id price"
    ); // Fetch only required fields
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products" });
  }
};

exports.applyCoupon = async (req, res) => {
  const { couponCode } = req.body;
  const userId = req.session.userId;

  try {
    // Check for the coupon in the database
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

exports.removeCoupon = async (req, res) => {
  const { couponCode } = req.body;
  const userId = req.session.userId;

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

exports.orderPlaced = async (req, res) => {
  try {
    const userId = req.session.userId;
    const {
      items,
      paymentMethod,
      address,
      total,
      subtotal,
      discountAmount,
      couponCode,
      status,
    } = req.body;

    // Check for required details
    if (!userId || !items || !paymentMethod || !address) {
      return res
        .status(400)
        .json({ message: "Missing required order details" });
    }

     // Validate stock and listing status of each item
     for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          message: `Product with ID ${item.productId} not found`,
        });
      }

      if (product.stock < item.quantity || !product.listed) {
        return res.status(400).json({
          message: `Product "${product.name}" is either out of stock or not available for sale.`,
        });
      }
    }

    // Calculate offer, discount, and payment totals
    const afteroffer = total - subtotal;
    const totalAfterDiscount = afteroffer + discountAmount;
    const paymentTotal = total + subtotal * 0.03 - totalAfterDiscount;

    // Check if wallet payment is selected
    if (paymentMethod === "walletPayment") {
      const wallet = await Wallet.findOne({ userId });

      // Ensure wallet balance is sufficient
      if (wallet.balance < paymentTotal) {
        return res.status(400).json({
          message: `Insufficient wallet balance for this order. Your current balance is ${wallet.balance}.`,
        });
      }

      // Deduct from wallet balance
      wallet.balance -= paymentTotal;

      // Add transaction to the wallet's transactions array
      wallet.transactions.push({
        amount: paymentTotal,
        type: "debit",
        description: "Order Payment",
        date: new Date(),
      });

      await wallet.save();
    }

    // Create the new order with Pending status
    const newOrder = new Order({
      userId,
      items,
      paymentMethod,
      address,
      total,
      subtotal,
      afteroffer,
      totalAfterDiscount,
      paymentTotal,
      discountAmount,
      status: status,
    });

    const savedOrder = await newOrder.save();

    // Update stock if payment method is COD
    if (savedOrder.status === "Pending" && paymentMethod === "CashOnDelivery") {
      for (const item of items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
      }
    }

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });

      if (coupon) {
        const currentDate = new Date();
        if (
          currentDate >= coupon.validFrom &&
          currentDate <= coupon.validUntil &&
          coupon.usageLimit > 0
        ) {
          if (!coupon.appliedUsers.includes(userId)) {
            coupon.appliedUsers.push(userId);
          }
          coupon.usageLimit = Math.max(coupon.usageLimit - 1, 0);
          await coupon.save();
        } else {
          return res.status(400).json({ message: "Coupon is not valid" });
        }
      } else {
        return res.status(404).json({ message: "Coupon not found" });
      }
    }

    // Clear the cart after successful order placement
    if (savedOrder) {
      await Cart.findOneAndUpdate(
        { userId },
        { $set: { items: [] } },
        { new: true }
      );
      req.session.cart = null;
    }

    // Send success response
    res.json({
      message: "Order placed successfully",
      orderId: savedOrder._id,
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res
      .status(500)
      .json({ message: "Error placing order", error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const { razorpay_payment_id, status } = req.body;

  try {
    // Find the order by ID
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update the order with payment details
    if (razorpay_payment_id) order.razorpayPaymentId = razorpay_payment_id;
    order.status = status; // Either "Completed" or "Payment Failure"

    if (order.status === "Pending") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
      }
    }

    // Save the updated order
    await order.save();

    // Respond with success and the updated payment status
    res.json({
      message: "Order updated successfully",
      paymentStatus: order.paymentStatus,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res
      .status(500)
      .json({ message: "Failed to update order", error: error.message });
  }
};

exports.sendFailure = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (order.status == "Payment Failure") {
      res.status(400);
    }
  } catch (error) {}
};

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const options = {
      amount: amount,
      currency: currency,
      receipt: `order_rcptid_${new Date().getTime()}`,
    };

    
    

    // Create order using Razorpay SDK
    const order = await razorpay.orders.create(options);

    
    
    

    // Send the order details back to the client
    res.json({
      razorpayOrderId: order.id, // Razorpay order ID
      razorpayKeyId: process.env.RAZORPAY_KEY_ID, // Correctly return the key ID
      amount: order.amount, // Amount in paise
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: "Error creating Razorpay order" });
  }
};

exports.retryPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (order) {
      res.json({
        paymentTotal: order.paymentTotal,
        razorpayOrderId: order.razorpayOrderId,
      });
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Fetch user orders controller
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Find orders for the logged-in user
    const orders = await Order.find({ userId })
      .populate("items.productId")
      .sort({ placedAt: -1 });

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const isAuthenticated = req.session.userId ? true : false;

    // Fetch cart product count
    let cartProductCount = 0;
    if (isAuthenticated) {
      const cart = await Cart.findOne({ userId });
      if (cart) {
        cartProductCount = cart.items.length;
      }
    }

    // Fetch wishlist count
    let wishlistCount = 0;
    if (user && user.wishlist) {
      wishlistCount = user.wishlist.length;
    }

    // If no orders found, pass an empty array and message
    if (!orders || orders.length === 0) {
      return res.render("users/userorders", {
        orders: [],
        message: "No orders found",
        isAuthenticated,
        cartProductCount,
        wishlistCount, // Pass wishlist count to the view
      });
    }

    // Render the user orders page with orders and additional data
    res.render("users/userorders", {
      orders,
      isAuthenticated,
      cartProductCount,
      wishlistCount, // Pass wishlist count to the view
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

// Cancel order controller
exports.cancelOrder = async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await Order.findById(orderId).populate("items.productId");
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = "Canceled";
    await order.save();

    const wallet = await Wallet.findOne({ userId: order.userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found for the user" });
    }

    const refundAmount = order.paymentTotal;
    
    wallet.balance += refundAmount;

    wallet.transactions.push({
      amount: refundAmount,
      type: "credit",
      description: `Refund for Order Canceled`,
      date: new Date(),
    });

    for (let item of order.items) {
      const product = item.productId;
      product.stock += item.quantity;
      await product.save();
    }

    await wallet.save();

    res.redirect("/profile/orders");
  } catch (error) {
    console.error("Error canceling order:", error);
    res.status(500).json({ error: "Error canceling order" });
  }
};

// Handle Return Request Submission
exports.returnOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { returnReason } = req.body;

    const order = await Order.findById(orderId);

    if (!order || order.status !== "Completed") {
      return res.status(400).send("Order not eligible for return.");
    }

    order.returnRequested = true;
    order.returnReason = returnReason; 
    await order.save();

    res.redirect("/profile/orders");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

//Order Confirmation Page
exports.orderConfrimation = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.session.userId;

    const isAuthenticated = userId ? true : false;

    const order = await Order.findById(orderId).populate("items.productId");

    if (!order || order.userId.toString() !== userId) {
      return res.status(404).send("Order not found");
    }

    let cartProductCount = 0;
    if (isAuthenticated) {
      const cart = await Cart.findOne({ userId });
      if (cart) {
        cartProductCount = cart.items.length;
      }
    }

    const user = await User.findById(userId);
    const wishlistCount = user.wishlist.length;

    res.render("users/order-confirmation", {
      order,
      subtotal: order.subtotal,
      totalAfterDiscount: order.totalAfterDiscount,
      discountAmount: order.discountAmount,
      paymentTotal: order.paymentTotal,
      items: order.items,
      address: order.address,
      isAuthenticated,
      cartProductCount,
      wishlistCount,
      user,
    });
  } catch (error) {
    console.error("Error fetching order confirmation:", error);
    res.status(500).send("Internal Server Error");
  }
};

//View Order Details
exports.viewOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId)
      .populate("items.productId")
      .populate("userId");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const isAuthenticated = req.session.userId ? true : false;

    let cartProductCount = 0;
    if (isAuthenticated) {
      const cart = await Cart.findOne({ userId: req.session.userId });
      if (cart) {
        cartProductCount = cart.items.length;
      }
    }

    const user = await User.findById(req.session.userId);
    const wishlistCount = user ? user.wishlist.length : 0;

    res.render("users/order-details", {
      order,
      isAuthenticated,
      cartProductCount,
      wishlistCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

//Wallet Page
exports.getWallet = async (req, res) => {
  try {
    const userId = req.session.userId;

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

    

    // Render the user's wallet page with wallet balance, transactions, and other data
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

exports.getInvoice = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId)
      .populate("userId")
      .populate("items.productId");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader(
      "Content-disposition",
      `attachment; filename="invoice_${orderId}.pdf"`
    );
    res.setHeader("Content-type", "application/pdf");

    // Pipe the PDF to the response
    doc.pipe(res);

    // --- Header Section ---
    doc.fontSize(20).fillColor("#0076A8").text("INVOICE", { align: "center" });
    doc
      .fontSize(10)
      .fillColor("black")
      .text(`Order ID: ${orderId}`, { align: "right" })
      .text(`Date: ${new Date().toDateString()}`, { align: "right" });
    doc.moveDown(2);

    // --- Company Address ---
    doc
      .fontSize(12)
      .fillColor("#0076A8")
      .text("Company Address", { underline: true });
    doc
      .fontSize(12)
      .fillColor("#333")
      .text("Esportes", { align: "left" })
      .text("Kakkanchery", { align: "left" })
      .text("Kozhikode , 654897", { align: "left" })
      .text("Phone : 9656801830 ", { align: "left" });
    doc.moveDown();

    // --- Shipping Address ---
    const address = order.address;
    doc
      .fontSize(12)
      .fillColor("#0076A8")
      .text("Shipping Address", { underline: true });
    doc
      .fontSize(12)
      .fillColor("black")
      .text(`${address.name}`)
      .text(`${address.housename}`)
      .text(`${address.location}`)
      .text(`${address.city}, ${address.state} ${address.zip}`);
    doc.moveDown(2);

    // --- Order Details Table ---
    doc
      .fontSize(12)
      .fillColor("#0076A8")
      .text("Order Details", { underline: true, align: "left" });
    doc.moveDown(0.5);

    // Draw the header background
    doc.rect(50, doc.y, 500, 20).fill("#0076A8").stroke();

    // Set text color and font size for the header
    doc.fillColor("white").fontSize(10);

    let headerY = doc.y + 5;

    // Position each header item horizontally within the same row
    doc.text("Product", 60, headerY, { width: 100, align: "left" });
    doc.text("Quantity", 200, headerY, { width: 100, align: "center" });
    doc.text("Price", 340, headerY, { width: 100, align: "center" });
    doc.text("Total", 460, headerY, { width: 100, align: "center" });

    // Move down to avoid overlapping the next content with the header
    doc.moveDown(2);

    // Set the text color for the items
    doc.fillColor("black");

    // Define an initial y-position for the first item
    let itemY = doc.y + 5;

    // Loop through each item in the order
    order.items.forEach((item) => {
      const product = item.productId;

      // Display each item property in a single row
      doc.text(product.name, 55, itemY, { width: 180, align: "left" });
      doc.text(item.quantity, 250, itemY, { width: 80, align: "left" });
      doc.text(`${order.paymentTotal.toFixed(2)}`, 350, itemY, {
        width: 80,
        align: "center",
      });
      doc.text(
        `${(item.quantity * order.paymentTotal).toFixed(2)}`,
        450,
        itemY,
        {
          width: 80,
          align: "center",
        }
      );

      itemY += 20;
    });

    // --- Order Summary Section ---
    doc.moveDown(2);
    doc
      .fontSize(12)
      .fillColor("#0076A8")
      .text("Order Summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("black");

    doc.text(`Product Amount: ${order.subtotal.toFixed(2)}`, { align: "left" });
    doc.text(`Discount: ${order.discountAmount.toFixed(2)}`, {
      align: "left",
    });
    doc.text(`Total Discount: ${order.totalAfterDiscount.toFixed(2)}`, {
      align: "left",
    });
    doc.text(`Total to Pay: ${order.paymentTotal.toFixed(2)}`, {
      align: "left",
    });
    doc.moveDown(2);

    // --- Footer with Thank You Message ---
    doc.moveDown();
    doc
      .fontSize(12)
      .fillColor("#0076A8")
      .text("Thank you for shopping with us!", { align: "center" });

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.about = async (req, res) => {
  try {
    // const categories = await Category.find(); // Fetch all categories from MongoDB
    // const products = await Product.find({ listed: true }).populate('category').exec();
    const userId = req.session.userId;
    const isAuthenticated = req.session.userId ? true : false;
    const user = await User.findById(userId);

    // Fetch cart product count
    let cartProductCount = 0;
    if (isAuthenticated) {
      const cart = await Cart.findOne({ userId });
      if (cart) {
        cartProductCount = cart.items.length;
      }
    }

    // Fetch wishlist count
    const wishlistCount = user.wishlist.length;

    res.render("users/about", {
      isAuthenticated,
      cartProductCount,
      wishlistCount,
    });
  } catch (error) {
    
  }
};

//logout
exports.logout = async (req, res) => {
  try {
    req.session.destroy();
    res.clearCookie("connect.sid");
    res.redirect("/");
  } catch (error) {
    
  }
};
