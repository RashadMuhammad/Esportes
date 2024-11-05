const Order = require("../../models/Order");
const User = require("../../models/user");
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


// Render the dashboard
exports.renderDashboard = async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
  
      const totalOrders = await Order.countDocuments();
  
      const totalSales = await Order.aggregate([
        { $match: { status: "Completed" } }, 
        { $group: { _id: null, total: { $sum: "$paymentTotal" } } },
      ]);
      
      const totalSalesAmount = totalSales[0] ? totalSales[0].total : 0;
      
  
      const pendingOrders = await Order.countDocuments({ status: "Pending" });
  
      const bestSellingProducts = await Order.aggregate([
        { $match: { status: "Completed" } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            totalSold: { $sum: "$items.quantity" },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $unwind: "$productInfo",
        },
        {
          $project: {
            _id: 0,
            name: "$productInfo.name",
            images: "$productInfo.images",
            totalSold: 1,
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
      ]);
  
      
      
  
      const bestSellingCategories = await Order.aggregate([
        { $match: { status: "Completed" } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: "$productInfo" },
        {
          $lookup: {
            from: "categories",
            localField: "productInfo.category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        { $unwind: "$categoryInfo" },
        {
          $group: {
            _id: "$categoryInfo._id",
            name: { $first: "$categoryInfo.name" },
            image: { $first: "$categoryInfo.image" },
            totalSold: { $sum: "$items.quantity" },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
      ]);
  
  
      res.render("admin/index", {
        totalUsers,
        totalOrders,
        totalSalesAmount,
        pendingOrders,
        bestSellingProducts,
        bestSellingCategories,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  };
  
  // routes/dashboard.js
  exports.chartDashboard = async (req, res) => {
    const { filter } = req.query;
  
    let groupFormat;
    if (filter === 'weekly') {
      groupFormat = { week: { $week: "$placedAt" }, year: { $year: "$placedAt" } };
    } else if (filter === 'monthly') {
      groupFormat = { month: { $month: "$placedAt" }, year: { $year: "$placedAt" } };
    } else if (filter === 'yearly') {
      groupFormat = { year: { $year: "$placedAt" } };
    } else {
      return res.status(400).send("Invalid filter");
    }
  
    try {
      
      const salesData = await Order.aggregate([
        { $match: { status: "Completed" } },
        { $group: { _id: groupFormat, totalSales: { $sum: "$paymentTotal" } } },
        { $sort: { "_id": 1 } }
      ]);
  
      
      
       
      res.json(salesData);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      res.status(500).send("Error fetching sales data");
    }
  };
  
