require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');

const sequelize  = require('./config/db');
require('./models');   // load all models + associations

const routes            = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Ensure upload directories exist ─────────────────────────────
['uploads/products','uploads/categories','uploads/banners','uploads/avatars','uploads/misc']
  .forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

// ── Middlewares ──────────────────────────────────────────────────
app.use(cors({
  origin: true, // This reflects the request Origin back, allowing all origins even with credentials: true
  credentials: true
}));

// Raw body for Razorpay webhook (must come BEFORE express.json)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Idol Blessings Hub API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── API Routes ──────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 & Error handlers ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server after DB connection ────────────────────────────
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅  MySQL connected via Sequelize');

    await sequelize.sync({ alter: true });
    console.log('✅  Database tables synced');

    app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════╗');
      console.log('║     IDOL BLESSINGS HUB — BACKEND         ║');
      console.log('╠══════════════════════════════════════════╣');
      console.log(`║  Server   : http://localhost:${PORT}         ║`);
      console.log(`║  Health   : http://localhost:${PORT}/health  ║`);
      console.log(`║  API Base : http://localhost:${PORT}/api     ║`);
      console.log('╚══════════════════════════════════════════╝');
      console.log('');
      console.log('  Admin login → POST /api/auth/admin/login');
      console.log(`  Email    : ${process.env.ADMIN_EMAIL}`);
      console.log(`  Password : ${process.env.ADMIN_PASSWORD}`);
      console.log('');
    });
  } catch (err) {
    console.error('❌  Failed to connect to database:', err.message);
    console.error('   Make sure XAMPP MySQL is running and DB credentials in .env are correct.');
    process.exit(1);
  }
})();

module.exports = app;
