const express = require('express');
const authController = require('../controllers/userControllers/authController');
const profileController = require('../controllers/userControllers/profileController');
const addressController = require('../controllers/userControllers/addressController');
const cartController = require('../controllers/userControllers/cartController');
const orderController = require('../controllers/userControllers/orderController');
const productController = require('../controllers/userControllers/productController');
const wishlistController = require('../controllers/userControllers/wishlistController');
const couponWalletController = require('../controllers/userControllers/couponWalletController');
const index = require('../controllers/userControllers/index');
const { isAuthenticated, isNotAuthenticated, noCache } = require('../middlewares/user');

const userRoute = express.Router();

// HomePage
userRoute.get('/', index.home);
userRoute.get('/homesearch', index.advancedHomeSearch);
userRoute.get('/product-search',  productController.searchProducts);


//User Entering Stages
userRoute.get('/login', isNotAuthenticated,noCache, authController.login);
userRoute.post('/login', isNotAuthenticated,noCache, authController.verifylogin);
userRoute.get('/signup', isNotAuthenticated, noCache,authController.signup);
userRoute.post('/signup',  isNotAuthenticated,noCache,authController.insertUser);
userRoute.get('/otpverification', isNotAuthenticated,noCache,authController.otpverification);
userRoute.post('/otpverification',isNotAuthenticated,noCache, authController.verifyOtp);
userRoute.post('/resendotp',isNotAuthenticated,noCache, authController.resendOtp);

//Forgot Password
userRoute.get('/forgetpassword',isNotAuthenticated,noCache, authController.forgetPassword);
userRoute.post('/send-otp',isNotAuthenticated,authController.forgetPasswordOtp)
userRoute.get('/forgetotppage',isNotAuthenticated,noCache, authController.forgetOtpPage);
userRoute.post('/resendforgetotppage',isNotAuthenticated,noCache, authController.resendForgetPasswordOtp);
userRoute.post('/forgetverify-otp',isNotAuthenticated,noCache, authController.forgetVerifyOtp);
userRoute.get('/newpasswordPage', isNotAuthenticated, noCache, authController.newPassword);
userRoute.post('/newpassword',isNotAuthenticated,noCache, authController.newpassVerify);

//Products and Product Details
userRoute.get('/product',productController.product)
userRoute.get('/product/:id',productController.productDetails)
userRoute.post('/product/:name/:id', productController.categoryFilter);
userRoute.get('/product-detail/:id',productController.productDetId);
userRoute.get('/search',productController.advancedSearch);

//Wishlist
userRoute.get('/wishlist',isAuthenticated,wishlistController.getWishlist)
userRoute.post('/wishlist/add',isAuthenticated,wishlistController.addToWishlist)
userRoute.delete('/wishlist/:productId',isAuthenticated,wishlistController.removeFromWishlist)

//User Profile
userRoute.get('/profile', isAuthenticated, profileController.getUserProfile);
userRoute.get('/availablecoupons', isAuthenticated, couponWalletController.getAvailableCoupons);
userRoute.post('/changePassword',isAuthenticated,profileController.changePassword)
userRoute.post('/updateProfile',isAuthenticated,profileController.editProfile)

//User Addresses 
userRoute.get('/addresses',isAuthenticated,addressController.getaddresses)
userRoute.post('/addresses/update', isAuthenticated, addressController.editAddresses);
userRoute.post('/addresses/add',isAuthenticated,addressController.addaddresses)
userRoute.delete('/addresses/delete/:id', isAuthenticated, addressController.deleteAddress);

// Render shopping cart page
userRoute.get('/shoping-cart', isAuthenticated, noCache,cartController.shopingcart);
userRoute.post('/add-to-cart', isAuthenticated,cartController.addToCart);
userRoute.post('/update-cart', isAuthenticated, cartController.updateCart);
userRoute.post('/remove-from-cart', isAuthenticated, cartController.removeFromCart);

//Checkout Page which the User checked Before Placing Orders
userRoute.get('/checkout',isAuthenticated,noCache,orderController.checkoutPage)
userRoute.post('/create-razorpay-order', isAuthenticated, orderController.createRazorpayOrder);
userRoute.post('/update-order/:id', isAuthenticated, orderController.updateOrder)
userRoute.post('/place-order', isAuthenticated, orderController.orderPlaced);
userRoute.post('/send-failue/:id', isAuthenticated, orderController.sendFailure)
userRoute.get('/get-order/:orderId',isAuthenticated,orderController.retryPayment) 



userRoute.post('/fetch-products', isAuthenticated, orderController.fetchProducts)
userRoute.post('/validate-coupon', isAuthenticated, couponWalletController.applyCoupon)
userRoute.post('/remove-coupon', isAuthenticated, couponWalletController.removeCoupon)

//Oreder Details of User
userRoute.get('/profile/orders', isAuthenticated, orderController.getUserOrders);
userRoute.post('/profile/orders/cancel/:id', isAuthenticated, orderController.cancelOrder);
userRoute.post('/orders/return/:id', isAuthenticated, orderController.returnOrder);

//Success Page for Order Confirmation of an User
userRoute.get('/order-confirmation/:id', isAuthenticated, orderController.orderConfrimation);
userRoute.get('/orders/:id',isAuthenticated,orderController.viewOrderDetails)
userRoute.get('/download-invoice/:orderId',isAuthenticated,orderController.getInvoice)


//Get wallet
userRoute.get('/wallet',isAuthenticated,couponWalletController.getWallet)



userRoute.get('/about',index.about)

userRoute.post('/logout', noCache, authController.logout)


//User Logged Out Route
// userRoute.post('/logout', logout);

module.exports = userRoute;
