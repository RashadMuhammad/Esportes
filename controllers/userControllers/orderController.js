const User = require("../../models/user");
const Address = require("../../models/Address");
const Product = require("../../models/Product");
const Cart = require("../../models/Cart");
const Order = require("../../models/Order");
const Coupon = require("../../models/Coupon");
const Offer = require("../../models/Offer");
const Wallet = require("../../models/Wallet");
const PDFDocument = require("pdfkit");
require("dotenv").config();

const Razorpay = require("razorpay");

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

exports.sendFailure = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (order.status == "Payment Failure") {
      res.status(400);
    }
  } catch (error) {}
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

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});
