const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Payment, Order } = require('../models');

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

// POST /api/payments/create-order
// Creates a Razorpay order for a given app order
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { order_id } = req.body;

    const order = await Order.findOne({ where: { id: order_id, user_id: req.user.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.payment_status === 'paid') {
      return res.status(400).json({ success: false, message: 'Order is already paid.' });
    }

    const razorpay = getRazorpayInstance();

    // Razorpay expects amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(parseFloat(order.total_amount) * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.order_number,
      notes: {
        order_id: order.id,
        user_id: req.user.id,
        order_number: order.order_number
      }
    });

    // Save payment record
    await Payment.create({
      order_id: order.id,
      user_id: req.user.id,
      razorpay_order_id: razorpayOrder.id,
      amount: order.total_amount,
      currency: 'INR',
      status: 'created',
      gateway_response: JSON.stringify(razorpayOrder)
    });

    res.json({
      success: true,
      data: {
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        order_number: order.order_number,
        prefill: {
          name: order.shipping_name,
          contact: order.shipping_phone
        },
        notes: razorpayOrder.notes
      }
    });
  } catch (err) { next(err); }
};

// POST /api/payments/verify
// Verifies Razorpay payment signature and marks order as paid
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

    // Signature verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Mark payment as failed
      await Payment.update(
        { status: 'failed', failure_reason: 'Signature verification failed' },
        { where: { razorpay_order_id } }
      );
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    // Get payment details from Razorpay
    const razorpay = getRazorpayInstance();
    const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

    // Update payment record
    await Payment.update({
      razorpay_payment_id,
      razorpay_signature,
      status: 'paid',
      method: paymentDetails.method,
      gateway_response: JSON.stringify(paymentDetails),
      paid_at: new Date()
    }, { where: { razorpay_order_id } });

    // Update order payment status
    await Order.update(
      { payment_status: 'paid', status: 'confirmed' },
      { where: { id: order_id } }
    );

    res.json({
      success: true,
      message: 'Payment verified successfully. Order confirmed!',
      data: {
        razorpay_payment_id,
        order_id,
        status: 'paid'
      }
    });
  } catch (err) { next(err); }
};

// POST /api/payments/webhook  (Razorpay Webhook — no auth needed, verify with webhook secret)
const webhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) return res.status(200).json({ received: true }); // skip if not configured

    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const event = req.body;

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      await Payment.update(
        { status: 'paid', method: payment.method, paid_at: new Date() },
        { where: { razorpay_payment_id: payment.id } }
      );
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      await Payment.update(
        { status: 'failed', failure_reason: payment.error_description },
        { where: { razorpay_order_id: payment.order_id } }
      );
    }

    if (event.event === 'refund.created') {
      const refund = event.payload.refund.entity;
      await Payment.update(
        { refund_id: refund.id, refunded_amount: refund.amount / 100, status: 'refunded' },
        { where: { razorpay_payment_id: refund.payment_id } }
      );
    }

    res.status(200).json({ received: true });
  } catch (err) { next(err); }
};

// POST /api/admin/payments/refund/:paymentId
const initiateRefund = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.paymentId, { include: [{ model: Order, as: 'order' }] });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (payment.status !== 'paid') return res.status(400).json({ success: false, message: 'Only paid payments can be refunded.' });

    const { amount } = req.body; // partial or full refund in INR
    const razorpay = getRazorpayInstance();

    const refundAmountPaise = amount
      ? Math.round(parseFloat(amount) * 100)
      : Math.round(parseFloat(payment.amount) * 100);

    const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
      amount: refundAmountPaise,
      notes: { reason: req.body.reason || 'Admin initiated refund' }
    });

    await payment.update({
      refund_id: refund.id,
      refunded_amount: refund.amount / 100,
      status: 'refunded'
    });

    await Order.update({ payment_status: 'refunded', status: 'refunded' }, { where: { id: payment.order_id } });

    res.json({ success: true, message: 'Refund initiated successfully.', data: refund });
  } catch (err) { next(err); }
};

// GET /api/admin/payments
const adminGetPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = status ? { status } : {};
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Order, as: 'order', attributes: ['id', 'order_number', 'total_amount'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) } });
  } catch (err) { next(err); }
};

module.exports = { createRazorpayOrder, verifyPayment, webhook, initiateRefund, adminGetPayments };
