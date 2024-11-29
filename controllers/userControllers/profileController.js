const User = require("../../models/user");
const Cart = require("../../models/Cart");
const bcrypt = require("bcrypt");
require("dotenv").config();

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

// Controller to render the logged-in user's profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.session.userId; 

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
      wishlistCount = user.wishlist.length; 
    }

    res.render("users/userprofile", {
      user,
      isAuthenticated,
      cartProductCount,
      wishlistCount, 
    });
  } catch (error) {
    res.status(500).send("An error occurred");
  }
};
