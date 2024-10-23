const Category = require("../models/Category");
const Product = require("../models/Product");
const admin = require("../models/admin");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const Offer = require("../models/Offer");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Wallet = require("../models/Wallet");
const multer = require("multer");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const excelJS = require("exceljs");
const { Parser } = require("json2csv");
const path = require("path");
const { product } = require("./usercontroller");
const flash = require("flash");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads/"); // Store images in the 'public/uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with timestamp
  },
});

// Admin login page render
exports.adminlogin = async (req, res) => {
  try {
    res.render("admin/login");
  } catch (error) {
    console.log(error.message);
  }
};

// Verifying login credentials
exports.verifylogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const adminData = await admin.findOne({ email: email });

    if (adminData) {
      const passwordMatch = await bcrypt.compare(password, adminData.password);

      if (passwordMatch) {
        req.session.admin_id = adminData._id;

        req.session.save((err) => {
          if (err) {
            console.log("Session save error:", err);
          } else {
            res.redirect("/admin/Dashboard");
          }
        });
      } else {
        return res.render("admin/login", { message: "Incorrect password" });
      }
    } else {
      res.render("admin/login", { message: "Incorrect Gmail" });
    }
  } catch (error) {
    console.log("Login error:", error.message);
  }
};

// Render the dashboard
exports.renderDashboard = async (req, res) => {
  try {
    const adminData = await admin.find();
    res.render("admin/index", { admin: adminData });
  } catch (error) {
    console.log(error.message);
  }
};

exports.getSalesReport = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.body;
    let filter = {};

    if (reportType === "daily") {
      filter = { placedAt: { $gte: new Date().setHours(0, 0, 0, 0) } };
    } else if (reportType === "weekly") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filter = { placedAt: { $gte: weekAgo } };
    } else if (reportType === "monthly") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filter = { placedAt: { $gte: monthAgo } };
    } else if (reportType === "yearly") {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      filter = { placedAt: { $gte: yearAgo } };
    } else if (reportType === "custom" && startDate && endDate) {
      filter = {
        placedAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    const orders = await Order.find(filter);

    const overallSalesCount = orders.length;
    const overallOrderAmount = orders.reduce((acc, order) => acc + order.subtotal, 0);
    const overallDiscount = orders.reduce((acc, order) => acc + order.discountAmount, 0);
    const overallCouponDeductions = orders.reduce((acc, order) => acc + (order.couponDeduction || 0), 0);

    res.json({
      orders,
      overallSalesCount,
      overallOrderAmount,
      overallDiscount,
      overallCouponDeductions,
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ message: 'Error generating sales report' });
  }
};

// Function to download CSV or Excel
exports.downloadSalesReportCSV = async (req, res) => {
  try {
    const { orders } = req.body;
    const fields = [
      "_id",
      "subtotal",
      "discountAmount",
      "totalAfterDiscount",
      "status",
    ]; 
    const parser = new Parser({ fields });
    const csv = parser.parse(orders);

    res.header("Content-Type", "text/csv");
    res.attachment("sales_report.csv");
    return res.send(csv);
  } catch (error) {
    console.log("Error generating CSV:", error.message);
    return res
      .status(500)
      .json({ message: "An error occurred while generating the CSV." });
  }
};

exports.downloadSalesReportPDF = async (req, res) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders)) {
      console.error("Invalid orders data:", orders);
      return res.status(400).json({ message: "Invalid orders data." });
    }

    const doc = new PDFDocument();
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="sales_report.pdf"'
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.fontSize(25).text("Sales Report", { align: "center" });
    doc.moveDown();

    orders.forEach((order) => {
      doc.fontSize(12).text(`Order ID: ${order._id}`);
      doc.text(`Subtotal: ${order.subtotal}`);
      doc.text(`Discount: ${order.discountAmount}`);
      doc.text(`Total: ${order.totalAfterDiscount}`);
      doc.text(`Status: ${order.status}`);
      doc.moveDown();
    });

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error.message);
    return res
      .status(500)
      .json({ message: "An error occurred while generating the PDF." });
  }
};

// Render the user management page
exports.renderUser = async (req, res) => {
  res.render("admin/users");
};

// Fetch users with pagination and search functionality
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const searchQuery = req.query.search ? req.query.search.trim() : "";

    let userQuery = {};
    if (searchQuery) {
      userQuery = {
        $or: [
          { name: { $regex: searchQuery, $options: "i" } },
          { email: { $regex: searchQuery, $options: "i" } },
        ],
      };
    }

    const totalUsers = await User.countDocuments(userQuery);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(userQuery).skip(skip).limit(limit).exec();

    res.render("admin/users", {
      users,
      currentPage: page,
      totalPages,
      searchQuery,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Toggle block/unblock status
exports.toggleBlock = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);

    if (user) {
      user.status = user.status === "blocked" ? "active" : "blocked";
      await user.save();

      if (user.status === "blocked") {
        delete req.session.userId;
      }
      res.redirect("/admin/users");
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error blocking/unblocking user:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const searchQuery = req.query.search ? req.query.search.trim() : "";

    let productQuery = {};
    if (searchQuery) {
      productQuery = { name: { $regex: searchQuery, $options: "i" } };
    }

    const totalProducts = await Product.countDocuments(productQuery);

    const product = await Product.find(productQuery)
      .populate("category")
      .skip(skip)
      .limit(limit)
      .exec();

    const categories = await Category.find();
    const totalPages = Math.ceil(totalProducts / limit);

    res.render("admin/products", {
      product,
      currentPage: page,
      totalPages: totalPages,
      totalProducts: totalProducts,
      categories,
      searchQuery,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

//To add Product
exports.addProduct = async (req, res) => {
  try {
    const { productNo, name, description, category, stock, price } = req.body;

    // Check if a product with the same name already exists
    const existingProduct = await Product.findOne({ name: name });
    if (existingProduct) {
      req.flash(
        "errorMessage",
        "Product name already exists. Please choose another name."
      );
      console.log("Flash Error Set:", req.flash("errorMessage"));
      return res.redirect("/admin/products"); // Redirect to the same page
    }

    // Process images and save the new product
    const imageNames = req.files.map((file) => file.filename);

    const newProduct = new Product({
      productNo,
      name,
      description,
      category,
      stock,
      price,
      images: imageNames,
    });

    await newProduct.save();
    req.flash("message", "Product added successfully!");
    res.redirect("/admin/Products");
  } catch (error) {
    console.error("Error adding product:", error);
    req.flash("errorMessage", "Error adding product.");
    res.redirect("/admin/products");
  }
};

//To edit Product
exports.editProduct = async (req, res) => {
  const productId = req.params.id;

  try {
    const product = await Product.findById(productId);

    const productData = {
      productNo: req.body.productNo,
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      category: req.body.category,
      images: product.images,
    };

    if (req.body.deleteImages) {
      const imagesToDelete = Array.isArray(req.body.deleteImages)
        ? req.body.deleteImages
        : [req.body.deleteImages];

      imagesToDelete.forEach((image) => {
        productData.images = productData.images.filter((img) => img !== image);

        const imagePath = path.join(__dirname, "..", "uploads", image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.filename);
      productData.images = [...productData.images, ...newImages];
    }

    await Product.findByIdAndUpdate(productId, productData);

    res.status(200).redirect("/admin/products");
  } catch (error) {
    console.log("Error updating product:", error);
    res.status(400).send("Error editing product.");
  }
};

//Toggle Unlist
exports.toggleProductListing = async (req, res) => {
  try {
    // Fetch the product by ID
    const product = await Product.findById(req.params.id);

    // Toggle the listed status
    const newListingStatus = !product.listed;

    await Product.findByIdAndUpdate(req.params.id, {
      listed: newListingStatus,
    });

    res.redirect("/admin/products");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin/products");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

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

    // Mark order as canceled
    order.status = "canceled";
    await order.save();

    // Get the user's wallet
    const wallet = await Wallet.findOne({ userId: order.userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found for the user" });
    }

    // Refund the order amount to the wallet
    const refundAmount = order.totalAfterDiscount;
    wallet.balance += refundAmount;

    // Add a new transaction to the wallet
    wallet.transactions.push({
      amount: refundAmount,
      type: "credit",
      description: `Order Cancelled by Admin and Refunded`,
      date: new Date(),
    });

    // Update the stock for each product in the order
    for (let item of order.items) {
      const product = item.productId;
      product.stock += item.quantity;
      await product.save();
    }

    // Save wallet changes
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

    // Find the user's wallet
    const wallet = await Wallet.findOne({ userId: order.userId });
    if (!wallet) {
      return res.status(404).send("Wallet not found");
    }

    if (action === "approve") {
      order.returnStatus = "Approved";
      order.status = "Returned";

      const refundAmount = order.totalAfterDiscount; // Amount to refund

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

// Fetch categories with pagination and search functionality
exports.renderallcategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search ? req.query.search.trim() : "";

    let categoryQuery = {};
    if (searchQuery) {
      categoryQuery = { name: { $regex: searchQuery, $options: "i" } };
    }

    const totalCategories = await Category.countDocuments(categoryQuery);
    const totalPages = Math.ceil(totalCategories / limit);

    const categories = await Category.find(categoryQuery)
      .skip(skip)
      .limit(limit);

    res.render("admin/category", {
      categories,
      currentPage: page,
      totalPages,
      searchQuery,
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).send("Error fetching categories");
  }
};

// Edit category
exports.editcategories = async (req, res) => {
  const { name, description } = req.body;
  const image = req.file ? req.file.filename : null;

  const updateData = { name, description };
  if (image) updateData.image = image;

  try {
    await Category.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/admin/Categories");
  } catch (err) {
    if (err.code === 11000) {
      req.flash("message", "Category already Exists.");
      res.redirect("/admin/categories");
    } else {
      res.status(500).send("An error occurred while adding the category.");
    }
  }
};

//To Unlist Categories
exports.toggleCategoryListing = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    const newListingStatus = !category.isListed;

    await Category.findByIdAndUpdate(req.params.id, {
      isListed: newListingStatus,
    });

    res.redirect("/admin/Categories");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// Function to unlist a category
exports.unlistcategories = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    category.isListed = !category.isListed;
    await category.save();

    res.status(200).json({
      success: true,
      isListed: category.isListed,
      message: "Category status updated",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

//To Delete Categories
exports.deletecategories = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.redirect("/admin/Categories");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting category");
  }
};

//To Add New Categories
exports.addNewCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      req.flash("message", "Category already Exists");
      return res.redirect("/admin/Categories");
    }
    const image = req.file ? req.file.filename : null;
    const newCategory = new Category({ name, description, image });
    await newCategory.save();
    res.redirect("/admin/Categories");
  } catch (error) {
    res.status(204).send("An error occurred while adding the category.");
  }
};

// Check if category name exists
exports.checkname = async (req, res) => {
  const { name } = req.query;
  const exists = await Category.findOne({ name });
  res.json({ exists: !!exists });
};

// Render coupons page
exports.renderCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();

    res.render("admin/coupons", { coupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).send("Internal Server Error");
  }
};

// To handle coupon update
exports.updateCoupon = async (req, res) => {
  try {
    console.log("Incoming coupon update request:", req.body);
    const couponId = req.params.id;

    const {
      code,
      discountType,
      discountValue,
      minCartValue,
      maxDiscountValue,
      validFrom,
      validUntil,
      usageLimit,
    } = req.body;

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      {
        code,
        discountType,
        discountValue,
        minCartValue,
        maxDiscountValue,
        validFrom,
        validUntil,
        usageLimit,
      },
      { new: true }
    );

    if (!updatedCoupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.redirect("/admin/coupons");
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({ message: "Server error while updating coupon" });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.couponId;

    // Find and delete the coupon by ID
    const result = await Coupon.findByIdAndDelete(couponId);

    if (result) {
      console.log(`Coupon with ID ${couponId} deleted successfully.`);
      res.redirect("/admin/coupons");
    } else {
      console.log(`Coupon with ID ${couponId} not found.`);
      res.status(404).send("Coupon not found");
    }
  } catch (error) {
    console.error(`Error deleting coupon: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.addCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minCartValue,
      maxDiscountValue,
      validFrom,
      validUntil,
      usageLimit,
      productPrice // Pass the product price from the frontend or calculate it
    } = req.body;

    // Validate discountValue based on discountType
    if (discountType === 'percentage') {
      if (discountValue < 1 || discountValue > 80) {
        return res.status(400).send("Discount value must be between 1% and 80% for percentage discount.");
      }
    } else if (discountType === 'fixed') {
      if (discountValue >= minCartValue) {
        return res.status(400).send("Fixed discount value must be less than the minimum cart value.");
      }
    }

    // Create a new coupon object
    const newCoupon = new Coupon({
      code,
      discountType,
      discountValue,
      minCartValue: minCartValue || 0,
      maxDiscountValue: discountType === 'percentage' ? maxDiscountValue : null, // Only store maxDiscountValue for percentage discounts
      validFrom,
      validUntil,
      usageLimit: usageLimit || 1,
    });

    await newCoupon.save();

    console.log(`Coupon ${code} added successfully.`);

    res.redirect("/admin/coupons");
  } catch (error) {
    console.error("Error adding new coupon:", error.message);
    res.status(500).send("Server error");
  }
};

// Render offers page
exports.renderOffers = async (req, res) => {
  try {
    // Fetch offers and populate related product and category data
    const offers = await Offer.find()
      .populate("product", "name") // Only fetch the product name
      .populate("category", "name") // Only fetch the category name
      .exec();

    // Fetch products and categories
    const products = await Product.find();
    const categories = await Category.find();

    // Render the offers page with the fetched offers, products, and categories
    res.render("admin/offers", { offer: offers, offers, products, categories });
  } catch (err) {
    console.error("Error fetching offers:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Controller for fetching offer data for editing
exports.editmodalof = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate("product", "name")
      .populate("category", "name");

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: "Error fetching offer data" });
  }
};

// Controller for updating an offer
exports.updateOffer = async (req, res) => {
  try {
    const {
      type,
      discountValue,
      maxDiscountValue,
      validFrom,
      validUntil,
      minProductPrice,
      product,
      category,
    } = req.body;

    // Ensure that at least one of product or category exists
    if (!product && !category) {
      return res
        .status(400)
        .json({ message: "Product or Category is required" });
    }

    // Validate maxDiscountValue against minProductPrice
    if (maxDiscountValue > minProductPrice) {
      return res.status(400).json({
        message: "Max Discount Value cannot exceed Min Product Price.",
      });
    }

    // Prepare the update object, only including fields that are provided
    const updateData = {
      type,
      discountValue,
      maxDiscountValue,
      validFrom,
      validUntil,
      minProductPrice,
    };

    if (product) updateData.product = product;
    if (category) updateData.category = category;

    const updatedOffer = await Offer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedOffer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    res.json(updatedOffer);
  } catch (error) {
    console.error("Error updating offer:", error);
    res.status(500).json({ message: "Error updating offer" });
  }
};

exports.addOffer = async (req, res) => {
  try {
    const {
      offerType,
      productName,
      categoryName,
      discountType,
      discountValue,
      maxDiscountValue, // maxDiscountValue validation added
      validFrom,
      validUntil,
      minProductPrice,
      referrerBonus,
      refereeBonus,
    } = req.body;

    // Validate minimum product price
    if (minProductPrice < 0) {
      return res.status(400).send("Minimum product price cannot be negative.");
    }

    // Validate maxDiscountValue must be greater than minProductPrice
    if (offerType === "product") {
      const product = await Product.findOne({ name: productName });
      if (product) {
        if (discountType === "fixed" && discountValue > product.price) {
          return res
            .status(400)
            .send(" Discount value cannot be greater than Product price.");
        }
      }
    }
    // Validate discountType and discountValue
    if (discountType === "percentage") {
      if (discountValue > 80) {
        return res.status(400).send("Percentage discount cannot exceed 80%.");
      }
    }

    // Validate validFrom and validUntil dates
    const currentDate = new Date();
currentDate.setHours(23, 59, 59, 999); // Set current date to the end of today

const validFromDate = new Date(validFrom);
validFromDate.setHours(23, 59, 59, 999); // Set validFrom date to the end of the chosen date

// Check if 'validFrom' is in the past or today
if (validFromDate < currentDate) {
  return res.status(400).send("Valid From date cannot be in the past.");
}

// Check if 'validUntil' is after 'validFrom'
const validUntilDate = new Date(validUntil);
if (validUntilDate <= validFromDate) {
  return res.status(400).send("Valid Until date must be after Valid From date.");
}


    // Create a new offer object
    const newOffer = new Offer({
      type: offerType,
      discountType,
      discountValue,
      maxDiscountValue, // Include maxDiscountValue in the new offer object
      validFrom,
      validUntil,
      minProductPrice,
      referrerBonus, // Add bonuses to the new offer
      refereeBonus,
    });

    // Add product or category based on offerType
    if (offerType === "product") {
      const product = await Product.findOne({ name: productName });
      if (!product) {
        return res.status(400).send("Product not found.");
      }
      newOffer.product = product._id;
    } else if (offerType === "category") {
      const category = await Category.findOne({ name: categoryName });
      if (!category) {
        return res.status(400).send("Category not found.");
      }
      newOffer.category = category._id;
    }

    // Save the offer to the database
    await newOffer.save();

    // Redirect to offers page after success
    res.redirect("/admin/offers");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

// Listing and Unlisting Offers
exports.unlistOffers = async (req, res) => {
  try {
    const offerId = req.params.id;
    const newStatus = req.body.status;

    // Update the offer's status
    const updatedOffer = await Offer.findByIdAndUpdate(
      offerId,
      { status: newStatus },
      { new: true }
    );

    res.json(updatedOffer);
  } catch (error) {
    res.status(500).json({ message: "Error updating offer status" });
  }
};

// Controller method to delete the offer
exports.deleteOffer = async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Offer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting offer" });
  }
};

// Render deals page
exports.renderDeals = async (req, res) => {
  res.render("admin/deals");
};

// Render settings page
exports.renderSettings = async (req, res) => {
  res.render("admin/settings");
};

// Handle logout functionality
exports.logout = async (req, res) => {
  try {
    req.session.destroy();
    res.clearCookie("connect.sid");
    res.redirect("/admin/adminlogin");
  } catch (error) {
    console.log(error.message);
  }
};
