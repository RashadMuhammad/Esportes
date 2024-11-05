const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer");
const auth = require("../middlewares/admin");
const authController = require('../controllers/adminControllers/authController');
const dashboardController = require('../controllers/adminControllers/dashboardController');
const salesReportController = require('../controllers/adminControllers/salesReportController');
const userController = require('../controllers/adminControllers/userController');
const productController = require('../controllers/adminControllers/productController');
const categoryController = require('../controllers/adminControllers/categoryController');
const orderController = require('../controllers/adminControllers/orderController');
const couponController = require('../controllers/adminControllers/couponController');
const offerController = require('../controllers/adminControllers/offerController');
const settingsController = require('../controllers/adminControllers/settingsController');

// ======================================================================================================

// Admin login routes
router.get("/adminlogin", auth.islogout, authController.adminlogin);
router.post("/adminlogin", authController.verifylogin);

// =======================================================================================================

// Dashboard route
router.get("/Dashboard", auth.islogin, dashboardController.renderDashboard);
router.get("/sales-data", dashboardController.chartDashboard);
router.get("/sales-reportpage", auth.islogin, salesReportController.renderSalesReportPage);
router.post("/sales-report", salesReportController.getSalesReport);
router.post("/sales-report-pdf", salesReportController.downloadSalesReportPDF);
router.post("/sales-report-csv", salesReportController.downloadSalesReportCSV);

// =========================================================================================================

router.get("/users", auth.islogin, userController.getAllUsers);
router.post("/users/:id/toggle-block", userController.toggleBlock);

// ==========================================================================================================

//Product routes
router.get("/products", auth.islogin, productController.getAllProducts);
router.post(
  "/products/add",
  upload.array("images", 3),
  productController.addProduct
);
router.post(
  "/products/edit/:id",
  upload.array("images", 3),
  productController.editProduct
);
router.post(
  "/products/toggle-listing/:id",
  productController.toggleProductListing
);
router.post("/products/delete/:id", productController.deleteProduct);

// ===========================================================================================================

// Categories routes
router.get("/Categories", auth.islogin, categoryController.renderallcategories);
router.post(
  "/Categories/toggle-listing/:id",
  categoryController.toggleCategoryListing
);
// router.post('/Categories',adminController.addnewcategory)
router.post(
  "/Categories/edit/:id",
  upload.single("image"),
  categoryController.editcategories
);
router.post("/unlist-category/:id", categoryController.unlistcategories);
router.post("/Categories/delete/:id", categoryController.deletecategories);
router.post(
  "/Categories/add",
  upload.single("image"),
  categoryController.addNewCategory
);
router.get("/checkName", categoryController.checkname);

// ===========================================================================================================

// Orders route
router.get("/Orders", auth.islogin, orderController.renderOrders);
router.put("/orders/status", auth.islogin, orderController.updateOrderStatus);
router.delete("/orders/:orderId", auth.islogin, orderController.cancelOrder);
router.post(
  "/orders/return/:orderId/:action",
  auth.islogin,
  orderController.handleReturnRequest
);

// ============================================================================================================

// Coupons route
router.get("/Coupons", auth.islogin, couponController.renderCoupons);
router.post("/coupons/edit/:id", couponController.updateCoupon);
router.post("/coupons/delete/:couponId", couponController.deleteCoupon);
router.post("/coupons/add", couponController.addCoupon);

// =============================================================================================================

// Offers route
router.get("/Offers", auth.islogin, offerController.renderOffers);
router.post("/offers/add", offerController.addOffer);
router.get("/offers/:id", auth.islogin, offerController.editmodalof);
router.put("/offers/edit/:id", auth.islogin, offerController.updateOffer);
router.put(
  "/offers/toggle-status/:id",
  auth.islogin,
  offerController.unlistOffers
);
router.delete("/offers/delete/:id", auth.islogin, offerController.deleteOffer);

// ===============================================================================================================


// Settings route
router.get("/Settings", auth.islogin, settingsController.renderSettings);

// ===============================================================================================================

// Logout route
router.post("/logout", auth.islogin, authController.logout);

module.exports = router;
