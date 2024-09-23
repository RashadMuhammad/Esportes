const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer'); // Multer middleware
// const uploaded = require('../public/upload');
const adminController = require('../controllers/admincontroller');
const auth = require("../middlewares/admin");
const Category = require('../models/Category'); // Category model
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path')

// Admin login routes
router.get('/adminlogin', auth.islogout, adminController.adminlogin);
router.post('/adminlogin', adminController.verifylogin);

// Dashboard route
router.get('/Dashboard', adminController.renderDashboard);

// User management route
// router.get('/Users', adminController.renderUser);

// Route to display user list
router.get('/users', adminController.getAllUsers);

// Route to block/unblock user
router.post('/users/:id/toggle-block', adminController.toggleBlock);

// Route to display user list with search functionality
// router.get('/userlist', adminController.searchAllUsers);

router.get('/products', adminController.getAllProducts);

// In your routes file (e.g., adminRoutes.js)
router.post('/products/add', upload.array('images', 3), adminController.addProduct);

// Route to handle editing a product
router.post('/products/edit/:id', adminController.editProduct);

// Route to unlist a product
router.post('/products/toggle-listing/:id', adminController.toggleProductListing);

// Route to delete a product
router.post('/products/delete/:id', adminController.deleteProduct);

// Categories routes
router.get('/Categories',adminController.renderallcategories)

router.post('/Categories/toggle-listing/:id', adminController.toggleCategoryListing);

// router.post('/Categories',adminController.addnewcategory)

router.post('/Categories/edit/:id', upload.single('image'), adminController.editcategories);

// Route for unlisting or listing a category
router.post('/unlist-category/:id', adminController.unlistcategories);

router.post('/Categories/delete/:id', adminController.deletecategories);


router.post('/Categories/add', upload.single('image'), adminController.addNewCategory);

// Orders route
router.get('/Orders', adminController.renderOrders);

// Coupons route
router.get('/Coupons', adminController.renderCoupons);

// Offers route
router.get('/Offers', adminController.renderOffers);

// Deals route
router.get('/Deals', adminController.renderDeals);

// Settings route
router.get('/Settings', adminController.renderSettings);

// Logout route
router.post('/logout', auth.islogin, adminController.logout);

module.exports = router;
