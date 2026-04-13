const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  order_number: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    comment: 'Human-readable order ID like IBH-2024-000001'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded',
      'return_requested',
      'returned'
    ),
    defaultValue: 'pending'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  shipping_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  coupon_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'coupons',
      key: 'id'
    }
  },
  coupon_code: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  // Shipping address snapshot
  shipping_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  shipping_phone: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  shipping_address_line1: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  shipping_address_line2: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  shipping_city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  shipping_state: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  shipping_pincode: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  shipping_country: {
    type: DataTypes.STRING(60),
    defaultValue: 'India'
  },
  payment_method: {
    type: DataTypes.ENUM('razorpay', 'cod'),
    defaultValue: 'razorpay'
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  tracking_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  shipping_carrier: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancelled_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Order;
