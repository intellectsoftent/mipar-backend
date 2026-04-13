const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Banner = sequelize.define('Banner', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  subtitle: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  mobile_image_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  link_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  button_text: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  position: {
    type: DataTypes.ENUM('hero', 'middle', 'bottom', 'popup'),
    defaultValue: 'hero'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  valid_from: {
    type: DataTypes.DATE,
    allowNull: true
  },
  valid_until: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'banners',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Banner;
