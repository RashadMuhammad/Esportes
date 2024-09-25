const express = require('express');
const {
    login,
    signup,
    otpverification,
    shopingcart,
    verifylogin,
    insertUser,
    verifyOtp,
    resendOtp,
    home,
    logout,
    product,
    getCategories,
    productDetails,
    productDet,
    productDetId,
    about,
    how
} = require('../controllers/usercontroller');
const multer = require('multer');
const path = require('path');
const Category = require('../models/Category');
const { isAuthenticated, isNotAuthenticated, noCache } = require('../middlewares/user');

const userRoute = express.Router();

// Route handling
userRoute.get('/',isAuthenticated,noCache, home);
userRoute.get('/login', isNotAuthenticated,noCache, login);
userRoute.post('/login', isNotAuthenticated,noCache, verifylogin);
userRoute.get('/signup', isNotAuthenticated, noCache,signup);
userRoute.post('/signup',  isNotAuthenticated,noCache,insertUser);
userRoute.get('/otpverification', isNotAuthenticated,noCache,otpverification);
userRoute.post('/otpverification',isNotAuthenticated,noCache, verifyOtp);
userRoute.post('/resendotp',isNotAuthenticated,noCache, resendOtp);
userRoute.get('/product',isAuthenticated,product)

userRoute.get('/product/:id',isAuthenticated,productDetails)
userRoute.get('/productdetails',isAuthenticated,productDet)
// Route to display product details by ID
userRoute.get('/product-detail/:id', isAuthenticated,productDetId);
userRoute.get('/about',isAuthenticated,about)
userRoute.get('/shoping-cart', isAuthenticated,noCache, shopingcart);
userRoute.post('/logout',logout)
// userRoute.get('/categories', category)
// userRoute.get('/',getCategories);


// userRoute.get('/product', isAuthenticated,noCache, product);
userRoute.post('/logout', logout);

module.exports = userRoute;
