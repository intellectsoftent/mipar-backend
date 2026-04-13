// ── REVIEW CONTROLLER ──────────────────────────────────────────
const { Review, User, Product, Order, OrderItem, Wishlist, Address, Coupon, Banner, Notification } = require('../models');
const { Op } = require('sequelize');

// POST /api/reviews
const createReview = async (req, res, next) => {
  try {
    const { product_id, order_id, rating, title, body } = req.body;

    const product = await Product.findByPk(product_id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const existing = await Review.findOne({ where: { user_id: req.user.id, product_id } });
    if (existing) return res.status(409).json({ success: false, message: 'You have already reviewed this product.' });

    let isVerified = false;
    if (order_id) {
      const orderItem = await OrderItem.findOne({
        include: [{ model: Order, as: 'order', where: { id: order_id, user_id: req.user.id, status: 'delivered' } }],
        where: { product_id }
      });
      isVerified = !!orderItem;
    }

    const review = await Review.create({ product_id, user_id: req.user.id, order_id, rating, title, body, is_verified_purchase: isVerified });

    // Update product rating
    const allReviews = await Review.findAll({ where: { product_id, is_approved: true } });
    const avg = allReviews.length ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length : 0;
    await product.update({ rating_avg: avg.toFixed(2), rating_count: allReviews.length });

    res.status(201).json({ success: true, message: 'Review submitted. Pending approval.', data: review });
  } catch (err) { next(err); }
};

// GET /api/admin/reviews
const adminGetReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, is_approved } = req.query;
    const where = {};
    if (is_approved !== undefined) where.is_approved = is_approved === 'true';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Review.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Product, as: 'product', attributes: ['id', 'name', 'slug'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) } });
  } catch (err) { next(err); }
};

// PUT /api/admin/reviews/:id
const adminUpdateReview = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id, { include: [{ model: Product, as: 'product' }] });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    await review.update(req.body);

    // Recalculate product rating if approval status changed
    if (req.body.is_approved !== undefined) {
      const allApprovedReviews = await Review.findAll({ where: { product_id: review.product_id, is_approved: true } });
      const avg = allApprovedReviews.length ? allApprovedReviews.reduce((s, r) => s + r.rating, 0) / allApprovedReviews.length : 0;
      await Product.update({ rating_avg: avg.toFixed(2), rating_count: allApprovedReviews.length }, { where: { id: review.product_id } });
    }

    res.json({ success: true, message: 'Review updated.', data: review });
  } catch (err) { next(err); }
};

// DELETE /api/admin/reviews/:id
const adminDeleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    await review.destroy();
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) { next(err); }
};

// ── WISHLIST ────────────────────────────────────────────────────

const getWishlist = async (req, res, next) => {
  try {
    const items = await Wishlist.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Product, as: 'product', where: { is_active: true }, required: false }]
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

const toggleWishlist = async (req, res, next) => {
  try {
    const { product_id } = req.body;
    const existing = await Wishlist.findOne({ where: { user_id: req.user.id, product_id } });
    if (existing) {
      await existing.destroy();
      return res.json({ success: true, message: 'Removed from wishlist.', in_wishlist: false });
    }
    await Wishlist.create({ user_id: req.user.id, product_id });
    res.json({ success: true, message: 'Added to wishlist.', in_wishlist: true });
  } catch (err) { next(err); }
};

// ── ADDRESS ─────────────────────────────────────────────────────

const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.findAll({ where: { user_id: req.user.id }, order: [['is_default', 'DESC']] });
    res.json({ success: true, data: addresses });
  } catch (err) { next(err); }
};

const addAddress = async (req, res, next) => {
  try {
    const { full_name, phone, address_line1, address_line2, city, state, pincode, country, is_default, address_type } = req.body;
    if (is_default) {
      await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
    }
    const address = await Address.create({ user_id: req.user.id, full_name, phone, address_line1, address_line2, city, state, pincode, country, is_default, address_type });
    res.status(201).json({ success: true, message: 'Address added.', data: address });
  } catch (err) { next(err); }
};

const updateAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found.' });
    if (req.body.is_default) await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
    await address.update(req.body);
    res.json({ success: true, message: 'Address updated.', data: address });
  } catch (err) { next(err); }
};

const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found.' });
    await address.destroy();
    res.json({ success: true, message: 'Address deleted.' });
  } catch (err) { next(err); }
};

// ── COUPON ──────────────────────────────────────────────────────

const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await Coupon.findOne({
      where: {
        code: code.toUpperCase(),
        is_active: true,
        valid_from: { [Op.lte]: new Date() },
        valid_until: { [Op.gte]: new Date() }
      }
    });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached.' });
    }
    if (parseFloat(subtotal) < parseFloat(coupon.min_order_amount)) {
      return res.status(400).json({ success: false, message: `Minimum order amount ₹${coupon.min_order_amount} required for this coupon.` });
    }
    const { calculateDiscount } = require('../utils/helpers');
    const discount = calculateDiscount(coupon, parseFloat(subtotal));
    res.json({ success: true, message: `Coupon applied! You save ₹${discount.toFixed(2)}`, data: { coupon, discount } });
  } catch (err) { next(err); }
};

const adminCreateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create({ ...req.body, code: req.body.code.toUpperCase() });
    res.status(201).json({ success: true, message: 'Coupon created.', data: coupon });
  } catch (err) { next(err); }
};

const adminGetCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.findAll({ order: [['created_at', 'DESC']] });
    res.json({ success: true, data: coupons });
  } catch (err) { next(err); }
};

const adminUpdateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    await coupon.update(req.body);
    res.json({ success: true, message: 'Coupon updated.', data: coupon });
  } catch (err) { next(err); }
};

const adminDeleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    await coupon.destroy();
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) { next(err); }
};

// ── BANNER ──────────────────────────────────────────────────────

const getBanners = async (req, res, next) => {
  try {
    const { position } = req.query;
    const where = { is_active: true };
    if (position) where.position = position;
    const now = new Date();
    where[Op.or] = [
      { valid_from: null },
      { valid_from: { [Op.lte]: now }, valid_until: { [Op.gte]: now } }
    ];
    const banners = await Banner.findAll({ where, order: [['sort_order', 'ASC']] });
    res.json({ success: true, data: banners });
  } catch (err) { next(err); }
};

const adminCreateBanner = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Banner image is required.' });
    const banner = await Banner.create({ ...req.body, image_url: req.file.path });
    res.status(201).json({ success: true, message: 'Banner created.', data: banner });
  } catch (err) { next(err); }
};

const adminUpdateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found.' });
    const updates = { ...req.body };
    if (req.file) updates.image_url = req.file.path;
    await banner.update(updates);
    res.json({ success: true, message: 'Banner updated.', data: banner });
  } catch (err) { next(err); }
};

const adminDeleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found.' });
    await banner.destroy();
    res.json({ success: true, message: 'Banner deleted.' });
  } catch (err) { next(err); }
};

const adminGetBanners = async (req, res, next) => {
  try {
    const banners = await Banner.findAll({ order: [['sort_order', 'ASC']] });
    res.json({ success: true, data: banners });
  } catch (err) { next(err); }
};

// ── ADMIN USER MANAGEMENT ───────────────────────────────────────

const adminGetUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await User.findAll({ where, order: [['created_at', 'DESC']], limit: parseInt(limit), offset });
    res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) } });
  } catch (err) { next(err); }
};

const adminToggleUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot deactivate admin accounts.' });
    await user.update({ is_active: !user.is_active });
    res.json({ success: true, message: `User ${user.is_active ? 'activated' : 'deactivated'}.`, data: user });
  } catch (err) { next(err); }
};

// ── NOTIFICATIONS ───────────────────────────────────────────────

const getNotifications = async (req, res, next) => {
  try {
    const { Op: Op2 } = require('sequelize');
    const notifications = await Notification.findAll({
      where: {
        [Op2.or]: [{ user_id: req.user.id }, { user_id: null }]
      },
      order: [['created_at', 'DESC']],
      limit: 50
    });
    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
};

const markNotificationRead = async (req, res, next) => {
  try {
    await Notification.update({ is_read: true }, { where: { id: req.params.id, user_id: req.user.id } });
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) { next(err); }
};

const adminCreateNotification = async (req, res, next) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json({ success: true, data: notification });
  } catch (err) { next(err); }
};

module.exports = {
  // Reviews
  createReview, adminGetReviews, adminUpdateReview, adminDeleteReview,
  // Wishlist
  getWishlist, toggleWishlist,
  // Address
  getAddresses, addAddress, updateAddress, deleteAddress,
  // Coupon
  validateCoupon, adminCreateCoupon, adminGetCoupons, adminUpdateCoupon, adminDeleteCoupon,
  // Banner
  getBanners, adminCreateBanner, adminUpdateBanner, adminDeleteBanner, adminGetBanners,
  // Users
  adminGetUsers, adminToggleUser,
  // Notifications
  getNotifications, markNotificationRead, adminCreateNotification
};
