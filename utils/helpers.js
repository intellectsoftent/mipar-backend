const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `IBH-${year}-${random}`;
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

const calculateDiscount = (coupon, subtotal) => {
  if (!coupon) return 0;
  if (subtotal < parseFloat(coupon.min_order_amount)) return 0;

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = (subtotal * parseFloat(coupon.discount_value)) / 100;
    if (coupon.max_discount_amount) {
      discount = Math.min(discount, parseFloat(coupon.max_discount_amount));
    }
  } else {
    discount = parseFloat(coupon.discount_value);
  }
  return Math.min(discount, subtotal);
};

const calculateShipping = (subtotal) => {
  if (subtotal >= 999) return 0;   // Free shipping above ₹999
  if (subtotal >= 499) return 49;
  return 99;
};

const calculateTax = (amount) => {
  return parseFloat((amount * 0.18).toFixed(2)); // 18% GST
};

module.exports = {
  generateToken,
  generateOrderNumber,
  slugify,
  calculateDiscount,
  calculateShipping,
  calculateTax
};
