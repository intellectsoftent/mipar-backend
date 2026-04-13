const { Category, Product } = require('../models');
const { slugify } = require('../utils/helpers');
const { Op } = require('sequelize');

// GET /api/categories
const getAll = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { is_active: true, parent_id: null },
      include: [{ model: Category, as: 'subCategories', where: { is_active: true }, required: false }],
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
};

// GET /api/categories/:id
const getOne = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, is_active: true },
      include: [{ model: Category, as: 'subCategories', required: false }]
    });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, data: category });
  } catch (err) { next(err); }
};

// POST /api/admin/categories
const create = async (req, res, next) => {
  try {
    const { name, description, parent_id, sort_order, meta_title, meta_description } = req.body;
    const slug = slugify(name);

    const existing = await Category.findOne({ where: { slug } });
    if (existing) return res.status(409).json({ success: false, message: 'Category with this name already exists.' });

    const image = req.file ? req.file.path : null;
    const category = await Category.create({ name, slug, description, image, parent_id, sort_order, meta_title, meta_description });
    res.status(201).json({ success: true, message: 'Category created.', data: category });
  } catch (err) { next(err); }
};

// PUT /api/admin/categories/:id
const update = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });

    const updates = { ...req.body };
    if (req.body.name) updates.slug = slugify(req.body.name);
    if (req.file) updates.image = req.file.path;

    await category.update(updates);
    res.json({ success: true, message: 'Category updated.', data: category });
  } catch (err) { next(err); }
};

// DELETE /api/admin/categories/:id
const remove = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });

    const productCount = await Product.count({ where: { category_id: req.params.id } });
    if (productCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete: ${productCount} products are in this category.` });
    }

    await category.update({ is_active: false });
    res.json({ success: true, message: 'Category deactivated.' });
  } catch (err) { next(err); }
};

// GET /api/admin/categories  (all, including inactive)
const adminGetAll = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Category, as: 'subCategories', required: false }],
      order: [['sort_order', 'ASC']]
    });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, adminGetAll };
