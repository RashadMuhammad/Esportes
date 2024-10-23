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
    productDetails,
    productDet,
    productDetId,
    about,
    getUserProfile,
    changePassword,
    getaddresses,
    editAddresses,
    deleteAddress,
    addaddresses,
    addToCart,
    removeFromCart,
    getOrder,
    cancelOrder,
    advancedSearch,
    advancedHomeSearch,
    searchProducts,
    updateCart,
    getCheckout,
    checkoutPage,
    createAddress,
    orderPlaced,
    orderConfrimation,
    fetchProducts,
    getUserOrders,
    editProfile,
    viewOrderDetails,
    forgetPassword,
    forgetPasswordOtp,
    forgetVerifyOtp,
    forgetOtpPage,
    createRazorpayOrder,
    returnOrder,
    addToWishlist,
    getWishlist,
    removeFromWishlist,
    viewWallet,
    applycoupon,
    applyCoupon,
    newpassVerify,
    newPassword,
    getWallet,
    getAvailableCoupons,
    removeCoupon,
} = require('../controllers/usercontroller');
const multer = require('multer');
const path = require('path');
const Category = require('../models/Category');
const { isAuthenticated, isNotAuthenticated, noCache } = require('../middlewares/user');

const userRoute = express.Router();

// HomePage
userRoute.get('/',noCache, home);
userRoute.get('/homesearch', advancedHomeSearch);
userRoute.get('/product-search',  searchProducts);


//User Entering Stages
userRoute.get('/login', isNotAuthenticated,noCache, login);
userRoute.post('/login', isNotAuthenticated,noCache, verifylogin);
userRoute.get('/signup', isNotAuthenticated, noCache,signup);
userRoute.post('/signup',  isNotAuthenticated,noCache,insertUser);
userRoute.get('/otpverification', isNotAuthenticated,noCache,otpverification);
userRoute.post('/otpverification',isNotAuthenticated,noCache, verifyOtp);
userRoute.post('/resendotp',isNotAuthenticated,noCache, resendOtp);

//Forgot Password
userRoute.get('/forgetpassword',isNotAuthenticated,noCache, forgetPassword);
userRoute.post('/send-otp',isNotAuthenticated,forgetPasswordOtp)
userRoute.get('/forgetotppage',isNotAuthenticated,noCache, forgetOtpPage);
userRoute.post('/forgetverify-otp',isNotAuthenticated,noCache, forgetVerifyOtp);
userRoute.get('/newpasswordPage', isNotAuthenticated, noCache, newPassword);
userRoute.post('/newpassword',isNotAuthenticated,noCache, newpassVerify);

//Products and Product Details
userRoute.get('/product',product)
userRoute.get('/product/:id',productDetails)
// userRoute.get('/productdetails',isAuthenticated,productDet)
userRoute.get('/product-detail/:id',productDetId);
userRoute.get('/search',advancedSearch);

//Wishlist
userRoute.get('/wishlist',isAuthenticated,getWishlist)
userRoute.post('/wishlist/add',isAuthenticated,addToWishlist)
userRoute.delete('/wishlist/:productId',isAuthenticated,removeFromWishlist)

//User Profile
userRoute.get('/profile', isAuthenticated, getUserProfile);
userRoute.get('/availablecoupons', isAuthenticated, getAvailableCoupons);
userRoute.post('/changePassword',isAuthenticated,changePassword)
userRoute.post('/updateProfile',isAuthenticated,editProfile)

//User Addresses 
userRoute.get('/addresses',isAuthenticated,getaddresses)
userRoute.post('/addresses/update', isAuthenticated, editAddresses);
userRoute.post('/addresses/add',isAuthenticated,addaddresses)
userRoute.delete('/addresses/delete/:id', isAuthenticated, deleteAddress);

// Render shopping cart page
userRoute.get('/shoping-cart', isAuthenticated, noCache,shopingcart);
userRoute.post('/add-to-cart', isAuthenticated,addToCart);
userRoute.post('/update-cart', isAuthenticated, updateCart);
userRoute.post('/remove-from-cart', isAuthenticated, removeFromCart);

//Checkout Page which the User checked Before Placing Orders
userRoute.get('/checkout',isAuthenticated,noCache,checkoutPage)
userRoute.post('/create-razorpay-order', isAuthenticated, createRazorpayOrder);
userRoute.post('/place-order', isAuthenticated, orderPlaced);
userRoute.post('/fetch-products', isAuthenticated, fetchProducts)
userRoute.post('/validate-coupon', isAuthenticated, applyCoupon)
userRoute.post('/remove-coupon', isAuthenticated, removeCoupon)

//Oreder Details of User
userRoute.get('/profile/orders', isAuthenticated, getUserOrders);
userRoute.post('/profile/orders/cancel/:id', isAuthenticated, cancelOrder);
userRoute.post('/orders/return/:id', isAuthenticated, returnOrder);

//Success Page for Order Confirmation of an User
userRoute.get('/order-confirmation/:id', isAuthenticated, orderConfrimation);
userRoute.get('/orders/:id',isAuthenticated,viewOrderDetails)


//Get wallet
userRoute.get('/wallet',isAuthenticated,getWallet)



userRoute.get('/about',isAuthenticated,about)

userRoute.post('/logout', noCache, logout)


//User Logged Out Route
// userRoute.post('/logout', logout);

module.exports = userRoute;
