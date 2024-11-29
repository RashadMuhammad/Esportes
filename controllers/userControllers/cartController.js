const User = require("../../models/user");
const Product = require("../../models/Product");
const Cart = require("../../models/Cart");
require("dotenv").config();

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

    let subtotal = cart.items.reduce(
      (acc, item) => acc + item.productId.price * item.quantity,
      0
    );
    const discountRate = 0.03;
    const discountAmount = subtotal * discountRate;
    const totalAfterDiscount = subtotal - discountAmount;

    await cart.save();

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

exports.shopingcart = async (req, res) => {
  try {
    const userId = req.session.userId;

    const isAuthenticated = !!userId;

    let cart = null;
    let cartProductCount = 0;
    let wishlistCount = 0;

    if (isAuthenticated) {
      cart = await Cart.findOne({ userId }).populate("items.productId");

      if (cart) {
        cartProductCount = cart.items.length;
        wishlistCount = (await User.findById(userId)).wishlist.length;
      }
    }

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
