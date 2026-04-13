const { Cart, Product, ProductImage } = require('../models');

const cartIncludes = [{
  model: Product,
  as: 'product',
  include: [{ model: ProductImage, as: 'images', where: { is_primary: true }, required: false }]
}];

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const items = await Cart.findAll({
      where: { user_id: req.user.id },
      include: cartIncludes
    });

    const subtotal = items.reduce((sum, item) => {
      const price = item.product.sale_price || item.product.price;
      return sum + parseFloat(price) * item.quantity;
    }, 0);

    res.json({ success: true, data: { items, subtotal: subtotal.toFixed(2), item_count: items.length } });
  } catch (err) { next(err); }
};

// POST /api/cart
const addToCart = async (req, res, next) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    const product = await Product.findOne({ where: { id: product_id, is_active: true } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    if (product.stock_status === 'out_of_stock') {
      return res.status(400).json({ success: false, message: 'Product is out of stock.' });
    }
    if (product.stock_quantity < quantity) {
      return res.status(400).json({ success: false, message: `Only ${product.stock_quantity} units available.` });
    }

    const price = product.sale_price || product.price;
    let cartItem = await Cart.findOne({ where: { user_id: req.user.id, product_id } });

    if (cartItem) {
      const newQty = cartItem.quantity + parseInt(quantity);
      if (newQty > product.stock_quantity) {
        return res.status(400).json({ success: false, message: `Only ${product.stock_quantity} units available.` });
      }
      await cartItem.update({ quantity: newQty, price_at_add: price });
    } else {
      cartItem = await Cart.create({ user_id: req.user.id, product_id, quantity, price_at_add: price });
    }

    const items = await Cart.findAll({ where: { user_id: req.user.id }, include: cartIncludes });
    res.json({ success: true, message: 'Item added to cart.', data: items });
  } catch (err) { next(err); }
};

// PUT /api/cart/:id
const updateQty = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cartItem = await Cart.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!cartItem) return res.status(404).json({ success: false, message: 'Cart item not found.' });

    if (parseInt(quantity) < 1) {
      await cartItem.destroy();
      return res.json({ success: true, message: 'Item removed from cart.' });
    }

    const product = await Product.findByPk(cartItem.product_id);
    if (quantity > product.stock_quantity) {
      return res.status(400).json({ success: false, message: `Only ${product.stock_quantity} units available.` });
    }

    await cartItem.update({ quantity });
    res.json({ success: true, message: 'Cart updated.' });
  } catch (err) { next(err); }
};

// DELETE /api/cart/:id
const removeItem = async (req, res, next) => {
  try {
    const cartItem = await Cart.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!cartItem) return res.status(404).json({ success: false, message: 'Cart item not found.' });
    await cartItem.destroy();
    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) { next(err); }
};

// DELETE /api/cart
const clearCart = async (req, res, next) => {
  try {
    await Cart.destroy({ where: { user_id: req.user.id } });
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) { next(err); }
};

module.exports = { getCart, addToCart, updateQty, removeItem, clearCart };
