const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'products', key: 'id' }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'orders', key: 'id' }
  },
  rating: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_verified_purchase: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  admin_reply: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Review;
