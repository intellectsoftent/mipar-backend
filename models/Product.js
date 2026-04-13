const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(220),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  short_description: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  sale_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  stock_status: {
    type: DataTypes.ENUM('in_stock', 'out_of_stock', 'on_backorder'),
    defaultValue: 'in_stock'
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: 'Weight in grams'
  },
  dimensions: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'L x W x H in cm'
  },
  material: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  deity: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Hindu deity the idol represents'
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_bestseller: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rating_avg: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00
  },
  rating_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  meta_title: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Product;
