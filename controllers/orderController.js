const { Op } = require('sequelize');
const { Order, OrderItem, Cart, Product, ProductImage, Coupon, Payment, User, Address } = require('../models');
const { generateOrderNumber, calculateDiscount, calculateShipping, calculateTax } = require('../utils/helpers');

const orderIncludes = [
  { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', include: [{ model: ProductImage, as: 'images', where: { is_primary: true }, required: false }] }] },
  { model: Payment, as: 'payments' }
];

// POST /api/orders  — create order from cart
const createOrder = async (req, res, next) => {
  const t = await require('../config/db').transaction();
  try {
    const { address_id, coupon_code, payment_method = 'razorpay', notes,
            // Inline address fields (when no saved address is used)
            shipping_name, shipping_phone,
            shipping_address_line1, shipping_address_line2,
            shipping_city, shipping_state, shipping_pincode,
            shipping_country = 'India' } = req.body;

    // Resolve shipping address — saved address takes priority, inline fields as fallback
    let addrFields;
    if (address_id) {
      const address = await Address.findOne({ where: { id: address_id, user_id: req.user.id } });
      if (!address) return res.status(400).json({ success: false, message: 'Invalid shipping address.' });
      addrFields = {
        shipping_name: address.full_name,
        shipping_phone: address.phone,
        shipping_address_line1: address.address_line1,
        shipping_address_line2: address.address_line2,
        shipping_city: address.city,
        shipping_state: address.state,
        shipping_pincode: address.pincode,
        shipping_country: address.country || 'India',
      };
    } else {
      // Validate required inline fields
      if (!shipping_name || !shipping_phone || !shipping_address_line1 || !shipping_city || !shipping_state || !shipping_pincode) {
        return res.status(400).json({ success: false, message: 'Please provide complete shipping address details.' });
      }
      addrFields = {
        shipping_name, shipping_phone,
        shipping_address_line1, shipping_address_line2: shipping_address_line2 || null,
        shipping_city, shipping_state, shipping_pincode, shipping_country,
      };
    }

    // Get cart items
    const cartItems = await Cart.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Product, as: 'product' }]
    });
    if (cartItems.length === 0) return res.status(400).json({ success: false, message: 'Cart is empty.' });

    // Validate stock & compute subtotal
    let subtotal = 0;
    for (const item of cartItems) {
      const product = item.product;
      if (!product.is_active) throw Object.assign(new Error(`"${product.name}" is no longer available.`), { statusCode: 400 });
      if (product.stock_quantity < item.quantity) throw Object.assign(new Error(`Insufficient stock for "${product.name}". Available: ${product.stock_quantity}`), { statusCode: 400 });
      const price = parseFloat(product.sale_price || product.price);
      subtotal += price * item.quantity;
    }

    // Apply coupon
    let coupon = null;
    let discountAmount = 0;
    if (coupon_code) {
      coupon = await Coupon.findOne({
        where: {
          code: coupon_code.toUpperCase(),
          is_active: true,
          valid_from: { [Op.lte]: new Date() },
          valid_until: { [Op.gte]: new Date() }
        }
      });
      if (!coupon) return res.status(400).json({ success: false, message: 'Invalid or expired coupon.' });
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return res.status(400).json({ success: false, message: 'Coupon usage limit reached.' });
      }
      discountAmount = calculateDiscount(coupon, subtotal);
    }

    const shippingAmount = calculateShipping(subtotal - discountAmount);
    const taxableAmount = subtotal - discountAmount + shippingAmount;
    const taxAmount = calculateTax(taxableAmount);
    const totalAmount = parseFloat((taxableAmount + taxAmount).toFixed(2));

    // Create order
    const order = await Order.create({
      order_number: generateOrderNumber(),
      user_id: req.user.id,
      subtotal: subtotal.toFixed(2),
      discount_amount: discountAmount.toFixed(2),
      shipping_amount: shippingAmount.toFixed(2),
      tax_amount: taxAmount.toFixed(2),
      total_amount: totalAmount,
      coupon_id: coupon ? coupon.id : null,
      coupon_code: coupon ? coupon.code : null,
      ...addrFields,
      payment_method,
      notes,
      status: 'pending',
      payment_status: 'pending'
    }, { transaction: t });

    // Create order items & deduct stock
    for (const item of cartItems) {
      const product = item.product;
      const price = parseFloat(product.sale_price || product.price);
      const primaryImage = await ProductImage.findOne({ where: { product_id: product.id, is_primary: true } });

      await OrderItem.create({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        product_image: primaryImage ? primaryImage.image_url : null,
        product_sku: product.sku,
        quantity: item.quantity,
        unit_price: price,
        total_price: (price * item.quantity).toFixed(2)
      }, { transaction: t });

      await Product.update(
        { stock_quantity: product.stock_quantity - item.quantity },
        { where: { id: product.id }, transaction: t }
      );
    }

    // Increment coupon usage
    if (coupon) await coupon.increment('used_count', { transaction: t });

    // Clear cart
    await Cart.destroy({ where: { user_id: req.user.id }, transaction: t });

    await t.commit();

    const full = await Order.findByPk(order.id, { include: orderIncludes });
    res.status(201).json({ success: true, message: 'Order placed successfully.', data: full });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// GET /api/orders
const getUserOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Order.findAndCountAll({
      where: { user_id: req.user.id },
      include: [{ model: OrderItem, as: 'items' }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
      distinct: true
    });
    res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) } });
  } catch (err) { next(err); }
};

// GET /api/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: orderIncludes
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// PUT /api/orders/:id/cancel
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage.' });
    }

    await order.update({ status: 'cancelled', cancelled_reason: req.body.reason || 'Cancelled by customer' });

    // Restore stock
    const items = await OrderItem.findAll({ where: { order_id: order.id } });
    for (const item of items) {
      await Product.increment('stock_quantity', { by: item.quantity, where: { id: item.product_id } });
    }

    res.json({ success: true, message: 'Order cancelled successfully.', data: order });
  } catch (err) { next(err); }
};

// ── ADMIN ────────────────────────────────────────────────────────

// GET /api/admin/orders
const adminGetOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, payment_status, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (search) {
      where[Op.or] = [
        { order_number: { [Op.like]: `%${search}%` } },
        { shipping_name: { [Op.like]: `%${search}%` } },
        { shipping_phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: OrderItem, as: 'items' }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
      distinct: true
    });
    res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) } });
  } catch (err) { next(err); }
};

// GET /api/admin/orders/:id
const adminGetOrderById = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        ...orderIncludes
      ]
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// PUT /api/admin/orders/:id/status
const updateStatus = async (req, res, next) => {
  try {
    const { status, tracking_number, shipping_carrier } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const updates = { status };
    if (tracking_number) updates.tracking_number = tracking_number;
    if (shipping_carrier) updates.shipping_carrier = shipping_carrier;
    if (status === 'delivered') {
      updates.delivered_at = new Date();
      // COD payment is collected on delivery — auto-mark as paid
      if (order.payment_method === 'cod') {
        updates.payment_status = 'paid';
      }
    }

    await order.update(updates);
    res.json({ success: true, message: 'Order status updated.', data: order });
  } catch (err) { next(err); }
};

// GET /api/admin/dashboard/stats
const dashboardStats = async (req, res, next) => {
  try {
    const [totalOrders, totalRevenue, pendingOrders, totalUsers] = await Promise.all([
      Order.count(),
      Order.sum('total_amount', { where: { payment_status: 'paid' } }),
      Order.count({ where: { status: 'pending' } }),
      User.count({ where: { role: 'customer' } })
    ]);

    // Orders last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentOrders = await Order.findAll({
      where: { created_at: { [Op.gte]: sevenDaysAgo } },
      attributes: ['status', [require('sequelize').fn('COUNT', '*'), 'count']],
      group: ['status']
    });

    res.json({
      success: true,
      data: {
        total_orders: totalOrders,
        total_revenue: totalRevenue || 0,
        pending_orders: pendingOrders,
        total_customers: totalUsers,
        recent_orders_by_status: recentOrders
      }
    });
  } catch (err) { next(err); }
};

module.exports = {
  createOrder, getUserOrders, getOrderById, cancelOrder,
  adminGetOrders, adminGetOrderById, updateStatus, dashboardStats
};
