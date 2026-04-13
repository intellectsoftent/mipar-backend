const { User } = require('../models');
const { generateToken } = require('../utils/helpers');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, password, phone, role: 'customer' });
    const token = generateToken(user.id, user.role);

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: { user, token }
    });
  } catch (err) { next(err); }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }

    const token = generateToken(user.id, user.role);
    return res.json({ success: true, message: 'Login successful.', data: { user, token } });
  } catch (err) { next(err); }
};

// POST /api/auth/admin/login
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email, role: 'admin' } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const token = generateToken(user.id, user.role);
    return res.json({ success: true, message: 'Admin login successful.', data: { user, token } });
  } catch (err) { next(err); }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

// PUT /api/auth/me
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updates = { name, phone };
    if (req.file) updates.profile_image = req.file.path;

    await req.user.update(updates);
    return res.json({ success: true, message: 'Profile updated.', data: req.user });
  } catch (err) { next(err); }
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!(await req.user.comparePassword(current_password))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    await req.user.update({ password: new_password });
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
};

module.exports = { register, login, adminLogin, getMe, updateProfile, changePassword };
