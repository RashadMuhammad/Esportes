const User = require("../../models/user");
const Cart = require("../../models/Cart");
const Wallet = require("../../models/Wallet");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { log } = require("console");
require("dotenv").config();

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
  } catch (error) {}
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
  } catch (error) {}
};

exports.newPassword = async (req, res) => {
  try {
    if (req.session.forgetEmail) {
      res.render("users/newpassword");
    }
  } catch (error) {}
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

//logout
exports.logout = async (req, res) => {
  try {
    req.session.destroy();
    res.clearCookie("connect.sid");
    res.redirect("/");
  } catch (error) {}
};
