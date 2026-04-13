const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProductImage = sequelize.define('ProductImage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  image_url: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  alt_text: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'product_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ProductImage;
