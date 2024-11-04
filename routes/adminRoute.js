const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer");
// const uploaded = require('../public/upload');
const adminController = require("../controllers/admincontroller");
const auth = require("../middlewares/admin");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Offer = require("../models/Offer");
const multer = require("multer");
const path = require("path");

// ======================================================================================================

// Admin login routes
router.get("/adminlogin", auth.islogout, adminController.adminlogin);
router.post("/adminlogin", adminController.verifylogin);

// =======================================================================================================

// Dashboard route
router.get("/Dashboard", auth.islogin, adminController.renderDashboard);
router.get("/sales-data", adminController.chartDashboard);

// ========================================================================================================

//Sales Report
router.get("/sales-reportpage", auth.islogin, adminController.renderSalesReportPage);
router.post("/sales-report", adminController.getSalesReport);
router.post("/sales-report-pdf", adminController.downloadSalesReportPDF);
router.post("/sales-report-csv", adminController.downloadSalesReportCSV);

// =========================================================================================================

router.get("/users", auth.islogin, adminController.getAllUsers);
router.post("/users/:id/toggle-block", adminController.toggleBlock);

// ==========================================================================================================

//Product routes
router.get("/products", auth.islogin, adminController.getAllProducts);
router.post(
  "/products/add",
  upload.array("images", 3),
  adminController.addProduct
);
router.post(
  "/products/edit/:id",
  upload.array("images", 3),
  adminController.editProduct
);
router.post(
  "/products/toggle-listing/:id",
  adminController.toggleProductListing
);
router.post("/products/delete/:id", adminController.deleteProduct);

// ===========================================================================================================

// Categories routes
router.get("/Categories", auth.islogin, adminController.renderallcategories);
router.post(
  "/Categories/toggle-listing/:id",
  adminController.toggleCategoryListing
);
// router.post('/Categories',adminController.addnewcategory)
router.post(
  "/Categories/edit/:id",
  upload.single("image"),
  adminController.editcategories
);
router.post("/unlist-category/:id", adminController.unlistcategories);
router.post("/Categories/delete/:id", adminController.deletecategories);
router.post(
  "/Categories/add",
  upload.single("image"),
  adminController.addNewCategory
);
router.get("/checkName", adminController.checkname);

// ===========================================================================================================

// Orders route
router.get("/Orders", auth.islogin, adminController.renderOrders);
router.put("/orders/status", auth.islogin, adminController.updateOrderStatus);
router.delete("/orders/:orderId", auth.islogin, adminController.cancelOrder);
router.post(
  "/orders/return/:orderId/:action",
  auth.islogin,
  adminController.handleReturnRequest
);

// ============================================================================================================

// Coupons route
router.get("/Coupons", auth.islogin, adminController.renderCoupons);
router.post("/coupons/edit/:id", adminController.updateCoupon);
router.post("/coupons/delete/:couponId", adminController.deleteCoupon);
router.post("/coupons/add", adminController.addCoupon);

// =============================================================================================================

// Offers route
router.get("/Offers", auth.islogin, adminController.renderOffers);
router.post("/offers/add", adminController.addOffer);
router.get("/offers/:id", auth.islogin, adminController.editmodalof);
router.put("/offers/edit/:id", auth.islogin, adminController.updateOffer);
router.put(
  "/offers/toggle-status/:id",
  auth.islogin,
  adminController.unlistOffers
);
router.delete("/offers/delete/:id", auth.islogin, adminController.deleteOffer);

// ===============================================================================================================


// Settings route
router.get("/Settings", auth.islogin, adminController.renderSettings);

// ===============================================================================================================

// Logout route
router.post("/logout", auth.islogin, adminController.logout);

module.exports = router;
