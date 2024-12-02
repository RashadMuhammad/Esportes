const User = require("../../models/user");
const Address = require("../../models/Address");
const Cart = require("../../models/Cart");
require("dotenv").config();

// Get all addresses of the logged-in user
exports.getaddresses = async (req, res) => {
  try {
    const userId = req.session.userId || req.session.passport?.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    const addresses = await Address.find({ user: userId });

    const isAuthenticated = req.session.userId || req.session.passport?.user ? true : false;

    let cartProductCount = 0;
    if (isAuthenticated) {
      const cart = await Cart.findOne({ userId: req.session.userId || req.session.passport?.user });
      if (cart) {
        cartProductCount = cart.items.length;
      }
    }

    let wishlistCount = 0;
    if (user && user.wishlist) {
      wishlistCount = user.wishlist.length;
    }

    res.render("users/useraddresses", {
      user,
      addresses,
      isAuthenticated,
      cartProductCount,
      wishlistCount,
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
    const userId = req.session.userId || req.session.passport?.user;

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

