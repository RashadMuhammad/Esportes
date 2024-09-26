const User = require("../models/user");
const Category = require("../models/Category");
const Product = require("../models/Product");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { log } = require("console");

// Render signup page
exports.signup = async (req, res) => {
  try {
    res.render("users/signup");
  } catch (error) {
    console.log(error);
  }
};

// Hash password
exports.securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

exports.insertUser = async (req, res) => {
  // Check for spaces in username and password
  if (/\s/.test(req.body.username) || /\s/.test(req.body.password)) {
    return res.render("users/signup", {
      message: "Your Username and Password cannot contain spaces",
    });
  }

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.render("users/signup", {
        message: "Email is already registered. Please use a different email.",
      });
    }

    // Securely hash the password before sending OTP
    const spassword = await exports.securePassword(req.body.password);
    const otp = crypto.randomInt(100000, 999999);
    const otpExpiration = Date.now() + 120000; // 2 minutes from now

    // Store the user's information and OTP in the session
    req.session.otp = otp;
    req.session.username = req.body.username; // Store username temporarily
    req.session.email = req.body.email; // Store email temporarily
    req.session.password = spassword; // Store the hashed password temporarily
    req.session.otpExpiration = otpExpiration;

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: req.body.email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.render("users/signup", {
          message: "Failed to send OTP. Please try again.",
        });
      } else {
        return res.redirect("/otpverification");
      }
    });
  } catch (err) {
    return res.send(err.message);
  }
};

// Render OTP verification page
exports.otpverification = async (req, res) => {
  try {
      res.render("users/otpsign");
  } catch (err) {
      return res.send("An error occurred while rendering the OTP verification page.");
  }
};

exports.verifyOtp = async (req, res) => {
  const otp = req.body.otp1 + req.body.otp2 + req.body.otp3 + req.body.otp4 + req.body.otp5 + req.body.otp6;
  const currentTime = Date.now();

  try {
      if (currentTime > req.session.otpExpiration) {
          return res.render("users/otpsign", {
              message: "OTP expired. Please request a new OTP.",
              expired: true,
          });
      } else if (otp == req.session.otp) {
          const newUser = new User({
              username: req.session.username,
              email: req.session.email,
              password: req.session.password,
          });

          console.log(req.session.emai);

          const result = await newUser.save();
          if (result) {
              // Clear session data
              delete req.session.otp;
              delete req.session.username;
              delete req.session.email;
              delete req.session.password;
              delete req.session.otpExpiration;

              req.session.userId = result._id; 
              return res.redirect("/"); 
          } else {
              return res.render("users/otpsign", {
                  message: "Failed to save user. Please try again.",
              });
          }
      } else {
          return res.render("users/otpsign", {
              message: "Invalid OTP. Please try again.",
          });
      }
  } catch (error) {
      console.log(error);
      return res.send("An error occurred during OTP verification.");
  }
};

// Resend OTP
// Resend OTP
exports.resendOtp = async (req, res) => {
  if (!req.session.email) {
        console.log(req.session.email);

    return res.render("users/login", { message: "Session expired. Please log in again." });
  }

  try {
    console.log(req.session.email);

    const otp = crypto.randomInt(100000, 999999);
    const otpExpiration = Date.now() + 120000; // 2 minutes from now

    // Store OTP and expiration in the session
    req.session.otp = otp;
    req.session.otpExpiration = otpExpiration;
    req.session.save(); // Ensure session is saved after modification

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log(req.session.email);
    

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: req.session.email,
      subject: "Resend OTP Code",
      text: `Your new OTP code is ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending OTP email:", error);
        return res.render("users/otpsign", {
          message: "Failed to resend OTP. Please try again.",
        });
      } else {
        return res.render("users/otpsign", {
          message: "A new OTP has been sent to your email.",
        });
      }
    });
  } catch (error) {
    console.error("Error during OTP resend:", error);
    return res.render("users/otpsign", { message: "Error resending OTP." });
  }
};

// Render login page
exports.login = async (req, res) => {
  try {
    res.render("users/login");
  } catch (error) {
    console.log(error);
  }
};

// Verify login
exports.verifylogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("users/login", { message: "User not found" });
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
      return res.render("users/login", { message: "Incorrect password" });
    }

    // If all checks pass, allow the user to log in
    req.session.userId = user._id;
    // console.log(email,"=email");
    return res.redirect("/"); // Redirect to the homepage or dashboard after login
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).send("Internal Server Error");
  }
};

// Render home page
exports.home = async (req, res) => {
  try {
    const categories = await Category.find(); // Fetch all categories from MongoDB
    const products = await Product.find({ listed: true })
      .populate("category")
      .exec();
    // console.log(products)

    res.render("users/index", { categories, products });
  } catch (error) {
    console.log(error);
  }
};

// Render shopping cart page
exports.shopingcart = async (req, res) => {
  try {
    res.render("users/shoping-cart");
  } catch (error) {
    console.log(error);
  }
};

//logout
exports.logout = async (req, res) => {
  try {
    req.session.destroy();
    res.clearCookie("connect.sid");
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

//Shoping cart
exports.shopingcart = async (req, res) => {
  try {
    res.render("users/shoping-cart");
  } catch (error) {
    console.log(error.message);
  }
};

// Fetch only listed categories for users
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isListed: true }); // Only fetch categories that are listed
    res.render("users/index", { categories });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching categories");
  }
};

//Product Page
exports.product = async (req, res) => {
  try {
    const categories = await Category.find(); // Fetch all categories from MongoDB
    const products = await Product.find({ listed: true })
      .populate("category")
      .exec();

    res.render("users/product", { categories, products });
  } catch (error) {
    console.log(error.message);
  }
};

exports.productDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    // console.log(product);

    if (!product) {
      return res.status(404).send("Product not found");
    }
    res.json(product);
  } catch (error) {
    res.status(500).send("Server error");
  }
};

// exports.how = async (req,res) => {
//   try {
//     const productId = req.params.id;
//       console.log(productId);
//       const product = await Product.findById(productId).populate('category'); // Populate category
//       console.log(product);
//     res.render('users/product-detail',{product})
//   } catch (error) {
//   console.log(error.message);
//   }
// }

exports.productDet = async (req, res) => {
  try {
    const categories = await Category.find(); // Fetch all categories from MongoDB
    const products = await Product.find({ listed: true })
      .populate("category")
      .exec();
    // console.log(products);

    res.render("users/product-detail", { categories, products });
  } catch (error) {
    console.log(error.message);
  }
};

// Controller to get product details by ID
exports.productDetId = async (req, res) => {
  try {
    const productId = req.params.id;
    // console.log(productId);
    const categories = await Category.find(); // Fetch all categories from MongoDB
    const product = await Product.findById(productId).populate("category"); // Populate category
    // console.log(product);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Render the 'product-detail' view and pass the product data
    res.render("users/product-detail", { product, categories });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

exports.about = async (req, res) => {
  try {
    // const categories = await Category.find(); // Fetch all categories from MongoDB
    // const products = await Product.find({ listed: true }).populate('category').exec();

    res.render("users/about");
  } catch (error) {
    console.log(error.message);
  }
};

exports.logout = async (req, res) => {
  try {
    req.session.destroy();
    res.clearCookie("connect.sid");
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};

// Controller to render the index page with products
// exports.getIndexPage = async (req, res) => {
//     try {
//       // Fetch all products from the database
//       const products = await Product.find().populate('category').exec();
//       res.render('index', { products });
//     } catch (err) {
//       console.error(err);
//       res.status(500).send('Server Error');
//     }
//   };
