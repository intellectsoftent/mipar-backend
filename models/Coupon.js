const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  discount_type: {
    type: DataTypes.ENUM('percentage', 'fixed'),
    allowNull: false
  },
  discount_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  min_order_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  max_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Max cap for percentage discounts'
  },
  usage_limit: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  used_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  per_user_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  valid_from: {
    type: DataTypes.DATE,
    allowNull: false
  },
  valid_until: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'coupons',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Coupon;
