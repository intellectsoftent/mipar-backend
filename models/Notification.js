const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'NULL = broadcast to all',
    references: { model: 'users', key: 'id' }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('order', 'payment', 'promotion', 'system', 'review'),
    defaultValue: 'system'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reference_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'order_id, payment_id etc'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Notification;
