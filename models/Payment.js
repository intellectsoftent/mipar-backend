const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  razorpay_order_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'order_id from Razorpay create order API'
  },
  razorpay_payment_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'payment_id after successful payment'
  },
  razorpay_signature: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Signature for verification'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'INR'
  },
  status: {
    type: DataTypes.ENUM('created', 'attempted', 'paid', 'failed', 'refunded'),
    defaultValue: 'created'
  },
  method: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'card, upi, netbanking, wallet etc'
  },
  gateway_response: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Full JSON response from Razorpay'
  },
  failure_reason: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  refund_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  refunded_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Payment;
