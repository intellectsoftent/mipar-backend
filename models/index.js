const sequelize = require('../config/db');

// Import all models
const User         = require('./User');
const Category     = require('./Category');
const Product      = require('./Product');
const ProductImage = require('./ProductImage');
const Address      = require('./Address');
const Cart         = require('./Cart');
const Coupon       = require('./Coupon');
const Order        = require('./Order');
const OrderItem    = require('./OrderItem');
const Payment      = require('./Payment');
const Review       = require('./Review');
const Wishlist     = require('./Wishlist');
const Banner       = require('./Banner');
const Notification = require('./Notification');

// ─── ASSOCIATIONS ────────────────────────────────────────────────

// Category self-reference (sub-categories)
Category.hasMany(Category, { as: 'subCategories', foreignKey: 'parent_id' });
Category.belongsTo(Category, { as: 'parentCategory', foreignKey: 'parent_id' });

// Category <-> Product
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Product <-> ProductImage
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// User <-> Address
User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses', onDelete: 'CASCADE' });
Address.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Cart
User.hasMany(Cart, { foreignKey: 'user_id', as: 'cartItems', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Product.hasMany(Cart, { foreignKey: 'product_id', as: 'cartEntries' });
Cart.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// User <-> Order
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Order <-> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Order <-> Coupon
Coupon.hasMany(Order, { foreignKey: 'coupon_id', as: 'orders' });
Order.belongsTo(Coupon, { foreignKey: 'coupon_id', as: 'coupon' });

// Order <-> Payment
Order.hasMany(Payment, { foreignKey: 'order_id', as: 'payments', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Review
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Order.hasMany(Review, { foreignKey: 'order_id', as: 'reviews' });
Review.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// User <-> Wishlist
User.hasMany(Wishlist, { foreignKey: 'user_id', as: 'wishlist', onDelete: 'CASCADE' });
Wishlist.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Product.hasMany(Wishlist, { foreignKey: 'product_id', as: 'wishlisted' });
Wishlist.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// User <-> Notification
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  ProductImage,
  Address,
  Cart,
  Coupon,
  Order,
  OrderItem,
  Payment,
  Review,
  Wishlist,
  Banner,
  Notification
};
