// seeders/seed.js  — run with: node seeders/seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Category, Product, ProductImage, Coupon, Banner } = require('../models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅  DB connected');

    // Sync all tables (force: false = non-destructive, alter: true = update schema)
    await sequelize.sync({ alter: true });
    console.log('✅  Tables synced');

    // ── ADMIN USER ───────────────────────────────────────────────
    // NOTE: Do NOT pre-hash here — the User model's beforeCreate hook
    // already hashes the password automatically. Pre-hashing causes
    // double-hashing which makes login always fail.
    const adminEmail = process.env.ADMIN_EMAIL || 'admin.mipar@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // If admin already exists, force-update the password to fix any double-hash
    let admin = await User.findOne({ where: { email: adminEmail } });
    if (admin) {
      // Use direct update with beforeUpdate hook to re-hash correctly
      admin.password = adminPassword;
      await admin.save();
      console.log(`✅  Admin password reset: ${admin.email}`);
    } else {
      admin = await User.create({
        name: 'Admin MIPAR',
        email: adminEmail,
        password: adminPassword, // plain text — beforeCreate hook will hash it
        role: 'admin',
        is_active: true,
        email_verified: true
      });
      console.log(`✅  Admin created: ${admin.email}`);
    }

    // ── CATEGORIES ───────────────────────────────────────────────
    const categoryData = [
      { name: 'Brass Idols',       slug: 'brass-idols',       description: 'Handcrafted brass idols of Hindu deities', sort_order: 1 },
      { name: 'Marble Idols',      slug: 'marble-idols',      description: 'Pure white marble idol sculptures',         sort_order: 2 },
      { name: 'Clay Idols',        slug: 'clay-idols',        description: 'Traditional hand-painted clay idols',       sort_order: 3 },
      { name: 'Puja Samagri',      slug: 'puja-samagri',      description: 'Complete puja essentials and kits',         sort_order: 4 },
      { name: 'Incense & Diyas',   slug: 'incense-diyas',     description: 'Agarbattis, dhoop, and clay diyas',         sort_order: 5 },
      { name: 'Divine Jewelry',    slug: 'divine-jewelry',    description: 'Jewelry and adornments for idols',          sort_order: 6 },
      { name: 'Spiritual Books',   slug: 'spiritual-books',   description: 'Sacred texts and spiritual literature',      sort_order: 7 },
      { name: 'Gift Sets',         slug: 'gift-sets',         description: 'Curated puja gift sets for all occasions',   sort_order: 8 },
    ];

    const categories = {};
    for (const cat of categoryData) {
      const [c] = await Category.findOrCreate({ where: { slug: cat.slug }, defaults: cat });
      categories[cat.slug] = c;
    }
    console.log('✅  Categories seeded');

    // ── PRODUCTS ─────────────────────────────────────────────────
    const productData = [
      {
        name: 'Brass Ganesha Idol - 6 inch',
        slug: 'brass-ganesha-idol-6-inch',
        description: 'Beautifully handcrafted brass Ganesha idol with intricate detailing. Perfect for home temple and gifting. Made by skilled artisans from Moradabad.',
        short_description: 'Handcrafted 6-inch brass Ganesha — auspicious and detailed.',
        price: 1499.00, sale_price: 1199.00,
        sku: 'BRASS-GANESHA-001',
        stock_quantity: 50, stock_status: 'in_stock',
        category_id: categories['brass-idols'].id,
        weight: 800, dimensions: '6x4x3 cm',
        material: 'Brass', deity: 'Ganesha',
        is_featured: true, is_bestseller: true, is_active: true
      },
      {
        name: 'Brass Lakshmi Idol - 8 inch',
        slug: 'brass-lakshmi-idol-8-inch',
        description: 'Standing Goddess Lakshmi brass idol showering blessings. Ideal for home puja room and Diwali gifting.',
        short_description: 'Auspicious 8-inch standing Lakshmi, brass finish.',
        price: 2199.00, sale_price: 1799.00,
        sku: 'BRASS-LAKSHMI-001',
        stock_quantity: 35, stock_status: 'in_stock',
        category_id: categories['brass-idols'].id,
        weight: 1100, dimensions: '8x5x4 cm',
        material: 'Brass', deity: 'Lakshmi',
        is_featured: true, is_bestseller: false, is_active: true
      },
      {
        name: 'Marble Radha Krishna Idol - 10 inch',
        slug: 'marble-radha-krishna-idol-10-inch',
        description: 'Exquisite white marble Radha Krishna pair with hand-painted color accents. A masterpiece of Indian craftsmanship.',
        short_description: 'Pristine marble Radha Krishna — a divine pair for your mandir.',
        price: 4999.00, sale_price: 3999.00,
        sku: 'MARBLE-RK-001',
        stock_quantity: 20, stock_status: 'in_stock',
        category_id: categories['marble-idols'].id,
        weight: 2500, dimensions: '10x6x5 cm',
        material: 'White Marble', deity: 'Radha Krishna',
        is_featured: true, is_bestseller: true, is_active: true
      },
      {
        name: 'Eco-Friendly Ganesh Chaturthi Idol - 12 inch',
        slug: 'eco-friendly-ganesh-chaturthi-12-inch',
        description: 'Biodegradable clay Ganesha idol made from natural materials. Dissolves completely in water without harming the environment.',
        short_description: 'Eco-friendly clay Ganesha — celebrate green!',
        price: 799.00, sale_price: null,
        sku: 'CLAY-GANESHA-001',
        stock_quantity: 100, stock_status: 'in_stock',
        category_id: categories['clay-idols'].id,
        weight: 1200, dimensions: '12x8x6 cm',
        material: 'Natural Clay', deity: 'Ganesha',
        is_featured: false, is_bestseller: true, is_active: true
      },
      {
        name: 'Complete Navratri Puja Samagri Kit',
        slug: 'navratri-puja-samagri-kit',
        description: 'All-in-one puja kit for Navratri with atta for diya, kumkum, sindoor, haldi, supari, dry fruits, janeu, camphor, incense sticks and more — 32 items.',
        short_description: '32-item Navratri puja kit — everything in one box.',
        price: 599.00, sale_price: 499.00,
        sku: 'PUJA-KIT-NAVRATRI',
        stock_quantity: 200, stock_status: 'in_stock',
        category_id: categories['puja-samagri'].id,
        weight: 500, dimensions: '25x20x10 cm',
        material: 'Various', deity: 'Durga',
        is_featured: false, is_bestseller: false, is_active: true
      },
      {
        name: 'Cycle Brand Agarbatti Mega Pack',
        slug: 'cycle-agarbatti-mega-pack',
        description: 'Assorted premium incense sticks in 12 fragrances — Rose, Jasmine, Sandalwood, Lavender, Mogra and more. 360 sticks total.',
        short_description: '360 premium incense sticks, 12 divine fragrances.',
        price: 349.00, sale_price: 299.00,
        sku: 'INC-CYCLE-MEGA',
        stock_quantity: 300, stock_status: 'in_stock',
        category_id: categories['incense-diyas'].id,
        weight: 400, material: 'Natural Herbs', deity: null,
        is_featured: false, is_bestseller: true, is_active: true
      },
      {
        name: 'Diwali Puja Gift Hamper - Premium',
        slug: 'diwali-puja-gift-hamper-premium',
        description: 'Luxurious Diwali hamper containing brass Lakshmi-Ganesha idols, premium incense, dry fruits, sweets, a decorative diya set, and kumkum. Gift-wrapped beautifully.',
        short_description: 'Premium Diwali hamper — the perfect festive gift.',
        price: 2499.00, sale_price: 1999.00,
        sku: 'GIFT-DIWALI-PREMIUM',
        stock_quantity: 40, stock_status: 'in_stock',
        category_id: categories['gift-sets'].id,
        weight: 2000, dimensions: '30x25x20 cm',
        material: 'Various', deity: 'Lakshmi Ganesha',
        is_featured: true, is_bestseller: false, is_active: true
      },
      {
        name: 'Bhagavad Gita - As It Is (Hardcover)',
        slug: 'bhagavad-gita-as-it-is-hardcover',
        description: 'The complete Bhagavad Gita with original Sanskrit verses, English transliteration, word-for-word translation, and purports by Srila Prabhupada. 900+ pages, hardcover.',
        short_description: 'Complete Bhagavad Gita As It Is — the definitive edition.',
        price: 450.00, sale_price: 380.00,
        sku: 'BOOK-BG-AIIS',
        stock_quantity: 150, stock_status: 'in_stock',
        category_id: categories['spiritual-books'].id,
        weight: 900, material: 'Paper/Hardcover', deity: 'Krishna',
        is_featured: false, is_bestseller: true, is_active: true
      }
    ];

    for (const prod of productData) {
      await Product.findOrCreate({ where: { slug: prod.slug }, defaults: prod });
    }
    console.log('✅  Products seeded');

    // ── COUPONS ──────────────────────────────────────────────────
    const coupons = [
      {
        code: 'WELCOME10',
        description: '10% off for new customers',
        discount_type: 'percentage',
        discount_value: 10,
        min_order_amount: 500,
        max_discount_amount: 200,
        usage_limit: 1000,
        per_user_limit: 1,
        is_active: true,
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2025-12-31')
      },
      {
        code: 'FLAT150',
        description: 'Flat ₹150 off on orders above ₹999',
        discount_type: 'fixed',
        discount_value: 150,
        min_order_amount: 999,
        usage_limit: 500,
        per_user_limit: 2,
        is_active: true,
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2025-12-31')
      },
      {
        code: 'DIWALI20',
        description: '20% off Diwali special',
        discount_type: 'percentage',
        discount_value: 20,
        min_order_amount: 1500,
        max_discount_amount: 500,
        usage_limit: 200,
        per_user_limit: 1,
        is_active: true,
        valid_from: new Date('2024-10-01'),
        valid_until: new Date('2025-11-30')
      }
    ];
    for (const c of coupons) {
      await Coupon.findOrCreate({ where: { code: c.code }, defaults: c });
    }
    console.log('✅  Coupons seeded');

    // ── BANNERS ──────────────────────────────────────────────────
    const banners = [
      {
        title: 'Divine Blessings, Delivered to Your Door',
        subtitle: 'Shop authentic idols, puja essentials & spiritual gifts',
        image_url: 'uploads/banners/hero-1.jpg',
        link_url: '/products',
        button_text: 'Shop Now',
        position: 'hero', sort_order: 1, is_active: true
      },
      {
        title: 'Diwali Mega Sale — Up to 30% Off',
        subtitle: 'Celebrate the festival of lights with our exclusive collection',
        image_url: 'uploads/banners/hero-2.jpg',
        link_url: '/products?is_featured=true',
        button_text: 'Explore Sale',
        position: 'hero', sort_order: 2, is_active: true
      },
      {
        title: 'Free Shipping on Orders Above ₹999',
        subtitle: null,
        image_url: 'uploads/banners/middle-1.jpg',
        link_url: '/products',
        button_text: null,
        position: 'middle', sort_order: 1, is_active: true
      }
    ];
    for (const b of banners) {
      await Banner.findOrCreate({ where: { title: b.title }, defaults: b });
    }
    console.log('✅  Banners seeded');

    console.log('\n🎉  Database seeded successfully!');
    console.log('──────────────────────────────────────');
    console.log(`Admin Email    : ${process.env.ADMIN_EMAIL || 'admin.mipar@gmail.com'}`);
    console.log(`Admin Password : ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('──────────────────────────────────────');

    process.exit(0);
  } catch (err) {
    console.error('❌  Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
