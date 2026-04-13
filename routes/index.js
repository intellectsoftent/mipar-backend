const express = require('express');
const router = express.Router();

const { protect, adminOnly } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const authCtrl    = require('../controllers/authController');
const catCtrl     = require('../controllers/categoryController');
const prodCtrl    = require('../controllers/productController');
const cartCtrl    = require('../controllers/cartController');
const orderCtrl   = require('../controllers/orderController');
const payCtrl     = require('../controllers/paymentController');
const miscCtrl    = require('../controllers/miscController');

// ════════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════════
router.post('/auth/register',         authCtrl.register);
router.post('/auth/login',            authCtrl.login);
router.post('/auth/admin/login',      authCtrl.adminLogin);
router.get ('/auth/me',               protect, authCtrl.getMe);
router.put ('/auth/me',               protect, upload.single('profile_image'), authCtrl.updateProfile);
router.put ('/auth/change-password',  protect, authCtrl.changePassword);

// ════════════════════════════════════════════════════════════════
//  CATEGORIES  (public read / admin write)
// ════════════════════════════════════════════════════════════════
router.get('/categories',                        catCtrl.getAll);
router.get('/categories/:id',                    catCtrl.getOne);

router.get   ('/admin/categories',               protect, adminOnly, catCtrl.adminGetAll);
router.post  ('/admin/categories',               protect, adminOnly, upload.single('image'), catCtrl.create);
router.put   ('/admin/categories/:id',           protect, adminOnly, upload.single('image'), catCtrl.update);
router.delete('/admin/categories/:id',           protect, adminOnly, catCtrl.remove);

// ════════════════════════════════════════════════════════════════
//  PRODUCTS  (public read / admin write)
// ════════════════════════════════════════════════════════════════
router.get('/products',                          prodCtrl.getAll);
router.get('/products/:slug',                    prodCtrl.getBySlug);

router.get   ('/admin/products',                 protect, adminOnly, prodCtrl.adminGetAll);
router.post  ('/admin/products',                 protect, adminOnly, upload.array('images', 10), prodCtrl.create);
router.put   ('/admin/products/:id',             protect, adminOnly, upload.array('images', 10), prodCtrl.update);
router.delete('/admin/products/:id',             protect, adminOnly, prodCtrl.remove);
router.delete('/admin/products/images/:imageId', protect, adminOnly, prodCtrl.deleteImage);

// ════════════════════════════════════════════════════════════════
//  CART
// ════════════════════════════════════════════════════════════════
router.get   ('/cart',      protect, cartCtrl.getCart);
router.post  ('/cart',      protect, cartCtrl.addToCart);
router.put   ('/cart/:id',  protect, cartCtrl.updateQty);
router.delete('/cart/:id',  protect, cartCtrl.removeItem);
router.delete('/cart',      protect, cartCtrl.clearCart);

// ════════════════════════════════════════════════════════════════
//  ORDERS
// ════════════════════════════════════════════════════════════════
router.post('/orders',              protect, orderCtrl.createOrder);
router.get ('/orders',              protect, orderCtrl.getUserOrders);
router.get ('/orders/:id',          protect, orderCtrl.getOrderById);
router.put ('/orders/:id/cancel',   protect, orderCtrl.cancelOrder);

router.get('/admin/dashboard/stats',      protect, adminOnly, orderCtrl.dashboardStats);
router.get('/admin/orders',               protect, adminOnly, orderCtrl.adminGetOrders);
router.get('/admin/orders/:id',           protect, adminOnly, orderCtrl.adminGetOrderById);
router.put('/admin/orders/:id/status',    protect, adminOnly, orderCtrl.updateStatus);

// ════════════════════════════════════════════════════════════════
//  PAYMENTS  (Razorpay)
// ════════════════════════════════════════════════════════════════
router.post('/payments/create-order',  protect, payCtrl.createRazorpayOrder);
router.post('/payments/verify',        protect, payCtrl.verifyPayment);
router.post('/payments/webhook',       payCtrl.webhook);   // no auth — Razorpay calls this

router.get ('/admin/payments',                    protect, adminOnly, payCtrl.adminGetPayments);
router.post('/admin/payments/refund/:paymentId',  protect, adminOnly, payCtrl.initiateRefund);

// ════════════════════════════════════════════════════════════════
//  REVIEWS
// ════════════════════════════════════════════════════════════════
router.post('/reviews',                protect, miscCtrl.createReview);
router.get ('/admin/reviews',          protect, adminOnly, miscCtrl.adminGetReviews);
router.put ('/admin/reviews/:id',      protect, adminOnly, miscCtrl.adminUpdateReview);
router.delete('/admin/reviews/:id',   protect, adminOnly, miscCtrl.adminDeleteReview);

// ════════════════════════════════════════════════════════════════
//  WISHLIST
// ════════════════════════════════════════════════════════════════
router.get ('/wishlist',  protect, miscCtrl.getWishlist);
router.post('/wishlist',  protect, miscCtrl.toggleWishlist);

// ════════════════════════════════════════════════════════════════
//  ADDRESSES
// ════════════════════════════════════════════════════════════════
router.get   ('/addresses',      protect, miscCtrl.getAddresses);
router.post  ('/addresses',      protect, miscCtrl.addAddress);
router.put   ('/addresses/:id',  protect, miscCtrl.updateAddress);
router.delete('/addresses/:id',  protect, miscCtrl.deleteAddress);

// ════════════════════════════════════════════════════════════════
//  COUPONS
// ════════════════════════════════════════════════════════════════
router.post('/coupons/validate',         protect, miscCtrl.validateCoupon);
router.get ('/admin/coupons',            protect, adminOnly, miscCtrl.adminGetCoupons);
router.post('/admin/coupons',            protect, adminOnly, miscCtrl.adminCreateCoupon);
router.put ('/admin/coupons/:id',        protect, adminOnly, miscCtrl.adminUpdateCoupon);
router.delete('/admin/coupons/:id',      protect, adminOnly, miscCtrl.adminDeleteCoupon);

// ════════════════════════════════════════════════════════════════
//  BANNERS
// ════════════════════════════════════════════════════════════════
router.get('/banners',                   miscCtrl.getBanners);
router.get ('/admin/banners',            protect, adminOnly, miscCtrl.adminGetBanners);
router.post('/admin/banners',            protect, adminOnly, upload.single('image'), miscCtrl.adminCreateBanner);
router.put ('/admin/banners/:id',        protect, adminOnly, upload.single('image'), miscCtrl.adminUpdateBanner);
router.delete('/admin/banners/:id',      protect, adminOnly, miscCtrl.adminDeleteBanner);

// ════════════════════════════════════════════════════════════════
//  ADMIN USER MANAGEMENT
// ════════════════════════════════════════════════════════════════
router.get('/admin/users',          protect, adminOnly, miscCtrl.adminGetUsers);
router.put('/admin/users/:id/toggle', protect, adminOnly, miscCtrl.adminToggleUser);

// ════════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ════════════════════════════════════════════════════════════════
router.get('/notifications',              protect, miscCtrl.getNotifications);
router.put('/notifications/:id/read',     protect, miscCtrl.markNotificationRead);
router.post('/admin/notifications',       protect, adminOnly, miscCtrl.adminCreateNotification);

module.exports = router;
