const Order = require("../../models/Order");
const Wallet = require("../../models/Wallet");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads/"); // Store images in the 'public/uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with timestamp
  },
});

// Render the orders page
exports.renderOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const totalOrders = await Order.countDocuments();
    const orders = await Order.find()
      .populate("userId")
      .populate("items.productId")
      .sort({ placedAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalPages = Math.ceil(totalOrders / limit);

    res.render("admin/orders", {
      orders,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    res.send("Error rendering orders page");
  }
};

//Update order status
exports.updateOrderStatus = async (req, res) => {
  const { orderId, status } = req.body;
  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;
    await order.save();
    res.json({ message: "Order status updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error updating order status" });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  const { orderId } = req.params;

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

    const refundAmount = order.totalAfterDiscount;
    wallet.balance += refundAmount;

    wallet.transactions.push({
      amount: refundAmount,
      type: "credit",
      description: `Order Cancelled by Admin and Refunded`,
      date: new Date(),
    });

    for (let item of order.items) {
      const product = item.productId;
      product.stock += item.quantity;
      await product.save();
    }

    await wallet.save();

    res.json({
      message: "Order canceled, refund credited to wallet, and stock updated",
    });
  } catch (error) {
    console.error("Error canceling order:", error);
    res.status(500).json({ error: "Error canceling order" });
  }
};

// Admin Approve or Reject Return
exports.handleReturnRequest = async (req, res) => {
  try {
    const { orderId, action } = req.params;

    const order = await Order.findById(orderId).populate("items.productId");
    if (!order || !order.returnRequested) {
      return res.status(400).send("Invalid return request.");
    }

    const wallet = await Wallet.findOne({ userId: order.userId });
    if (!wallet) {
      return res.status(404).send("Wallet not found");
    }

    if (action === "approve") {
      order.returnStatus = "Approved";
      order.status = "Returned";

      const refundAmount = order.paymentTotal;

      wallet.balance += refundAmount;

      wallet.transactions.push({
        amount: refundAmount,
        type: "credit",
        description: `Refund for returned order ${orderId}`,
        date: new Date(),
      });

      for (let item of order.items) {
        const product = item.productId;
        product.stock += item.quantity;
        await product.save();
      }
    } else if (action === "reject") {
      order.returnStatus = "Rejected";
    }

    await order.save();
    await wallet.save();

    res.redirect("/admin/orders");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

