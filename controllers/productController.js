const { Product, ProductImage, Category, Review, User } = require('../models');
const { slugify } = require('../utils/helpers');
const { Op } = require('sequelize');

const productIncludes = [
  { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
  { model: ProductImage, as: 'images', order: [['sort_order', 'ASC']] }
];

// GET /api/products
const getAll = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 12, category_id, search, min_price, max_price,
      sort = 'created_at', order = 'DESC', deity, is_featured, is_bestseller
    } = req.query;

    const where = { is_active: true };
    if (category_id) where.category_id = category_id;
    if (deity) where.deity = { [Op.like]: `%${deity}%` };
    if (is_featured === 'true') where.is_featured = true;
    if (is_bestseller === 'true') where.is_bestseller = true;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { deity: { [Op.like]: `%${search}%` } }
      ];
    }
    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price[Op.gte] = min_price;
      if (max_price) where.price[Op.lte] = max_price;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Product.findAndCountAll({
      where,
      include: productIncludes,
      order: [[sort, order]],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (err) { next(err); }
};

// GET /api/products/:slug
const getBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { slug: req.params.slug, is_active: true },
      include: [
        ...productIncludes,
        {
          model: Review,
          as: 'reviews',
          where: { is_approved: true },
          required: false,
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profile_image'] }]
        }
      ]
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

// POST /api/admin/products
const create = async (req, res, next) => {
  try {
    const {
      name, description, short_description, price, sale_price,
      sku, stock_quantity, category_id, weight, dimensions,
      material, deity, is_featured, is_active, is_bestseller,
      meta_title, meta_description, sort_order
    } = req.body;

    const slug = slugify(name);
    const exists = await Product.findOne({ where: { slug } });
    if (exists) return res.status(409).json({ success: false, message: 'Product with this name already exists.' });

    const product = await Product.create({
      name, slug, description, short_description, price, sale_price,
      sku, stock_quantity, category_id, weight, dimensions,
      material, deity, is_featured, is_active, is_bestseller,
      meta_title, meta_description, sort_order,
      stock_status: stock_quantity > 0 ? 'in_stock' : 'out_of_stock'
    });

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      const images = req.files.map((file, idx) => ({
        product_id: product.id,
        image_url: file.path,
        is_primary: idx === 0,
        sort_order: idx
      }));
      await ProductImage.bulkCreate(images);
    }

    const full = await Product.findByPk(product.id, { include: productIncludes });
    res.status(201).json({ success: true, message: 'Product created.', data: full });
  } catch (err) { next(err); }
};

// PUT /api/admin/products/:id
const update = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const updates = { ...req.body };
    if (req.body.name) updates.slug = slugify(req.body.name);
    if (req.body.stock_quantity !== undefined) {
      updates.stock_status = parseInt(req.body.stock_quantity) > 0 ? 'in_stock' : 'out_of_stock';
    }

    await product.update(updates);

    if (req.files && req.files.length > 0) {
      const existingCount = await ProductImage.count({ where: { product_id: product.id } });
      const images = req.files.map((file, idx) => ({
        product_id: product.id,
        image_url: file.path,
        is_primary: existingCount === 0 && idx === 0,
        sort_order: existingCount + idx
      }));
      await ProductImage.bulkCreate(images);
    }

    const full = await Product.findByPk(product.id, { include: productIncludes });
    res.json({ success: true, message: 'Product updated.', data: full });
  } catch (err) { next(err); }
};

// DELETE /api/admin/products/:id
const remove = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    await product.update({ is_active: false });
    res.json({ success: true, message: 'Product deactivated.' });
  } catch (err) { next(err); }
};

// DELETE /api/admin/products/images/:imageId
const deleteImage = async (req, res, next) => {
  try {
    const image = await ProductImage.findByPk(req.params.imageId);
    if (!image) return res.status(404).json({ success: false, message: 'Image not found.' });
    await image.destroy();
    res.json({ success: true, message: 'Image deleted.' });
  } catch (err) { next(err); }
};

// GET /api/admin/products
const adminGetAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category_id, stock_status } = req.query;
    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (category_id) where.category_id = category_id;
    if (stock_status) where.stock_status = stock_status;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Product.findAndCountAll({
      where,
      include: productIncludes,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / parseInt(limit)) }
    });
  } catch (err) { next(err); }
};

module.exports = { getAll, getBySlug, create, update, remove, deleteImage, adminGetAll };
