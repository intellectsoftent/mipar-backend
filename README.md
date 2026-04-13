# 🛕 Idol Blessings Hub — Backend API

A production-ready Node.js + Express + Sequelize + MySQL backend for the **Idol Blessings Hub** religious e-commerce platform. Includes full Razorpay payment gateway integration, admin panel APIs, and complete order management.

---

## 📁 Project Structure

```
idol-blessings-hub/
├── server.js                   # Entry point
├── .env                        # Environment variables
├── create_database.sql         # Run once in phpMyAdmin
├── package.json
│
├── config/
│   ├── db.js                   # Sequelize instance
│   └── database.js             # Sequelize CLI config
│
├── models/
│   ├── index.js                # All models + associations
│   ├── User.js
│   ├── Category.js
│   ├── Product.js
│   ├── ProductImage.js
│   ├── Address.js
│   ├── Cart.js
│   ├── Coupon.js
│   ├── Order.js
│   ├── OrderItem.js
│   ├── Payment.js
│   ├── Review.js
│   ├── Wishlist.js
│   ├── Banner.js
│   └── Notification.js
│
├── controllers/
│   ├── authController.js
│   ├── categoryController.js
│   ├── productController.js
│   ├── cartController.js
│   ├── orderController.js
│   ├── paymentController.js    # Razorpay integration
│   └── miscController.js       # Reviews, Wishlist, Address, Coupon, Banner, Users
│
├── routes/
│   └── index.js                # All routes
│
├── middlewares/
│   ├── auth.js                 # JWT protect + adminOnly
│   ├── errorHandler.js
│   └── upload.js               # Multer image upload
│
├── utils/
│   └── helpers.js              # Token, slugify, pricing helpers
│
├── seeders/
│   └── seed.js                 # Seeds admin + sample data
│
└── uploads/                    # Auto-created on server start
    ├── products/
    ├── categories/
    ├── banners/
    └── avatars/
```

---

## ⚙️ Prerequisites

- **XAMPP** with MySQL running on port 3306
- **Node.js** v18+ and npm
- **Razorpay account** (test mode for development)

---

## 🚀 Setup Guide

### Step 1 — Create the Database in XAMPP

1. Open **phpMyAdmin** → `http://localhost/phpmyadmin`
2. Click **SQL** tab and paste + run:

```sql
CREATE DATABASE IF NOT EXISTS `idol_blessings_hub`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Or open the file `create_database.sql` and import it.

---

### Step 2 — Install Dependencies

```bash
cd idol-blessings-hub
npm install
```

---

### Step 3 — Configure Environment

Edit `.env` file:

```env
PORT=5000
NODE_ENV=development

# XAMPP MySQL (no password by default)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=idol_blessings_hub
DB_USER=root
DB_PASSWORD=

# JWT Secret (change in production!)
JWT_SECRET=idol_blessings_hub_super_secret_jwt_key_2024
JWT_EXPIRES_IN=7d

# Admin Credentials
ADMIN_EMAIL=admin.mipar@gmail.com
ADMIN_PASSWORD=admin123

# Razorpay — get from https://dashboard.razorpay.com
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret   # optional

FRONTEND_URL=http://localhost:3000
```

> **Get Razorpay Keys:** Login to [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → API Keys → Generate Test Key

---

### Step 4 — Start Server (tables auto-created)

```bash
npm run dev
```

The server will:
1. Connect to MySQL
2. Auto-sync/create all 14 tables via Sequelize
3. Start on `http://localhost:5000`

---

### Step 5 — Seed Sample Data

```bash
node seeders/seed.js
```

This creates:
- ✅ Admin account (`admin.mipar@gmail.com` / `admin123`)
- ✅ 8 product categories
- ✅ 8 sample products (Ganesha, Lakshmi, Radha Krishna, etc.)
- ✅ 3 discount coupons (WELCOME10, FLAT150, DIWALI20)
- ✅ 3 homepage banners

---

## 🔑 Admin Login

```bash
POST http://localhost:5000/api/auth/admin/login
Content-Type: application/json

{
  "email": "admin.mipar@gmail.com",
  "password": "admin123"
}
```

Response gives you a JWT token. Use it as:
```
Authorization: Bearer <token>
```

---

## 📡 Complete API Reference

### 🔐 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new customer |
| POST | `/api/auth/login` | ❌ | Customer login |
| POST | `/api/auth/admin/login` | ❌ | Admin login |
| GET | `/api/auth/me` | ✅ | Get current user profile |
| PUT | `/api/auth/me` | ✅ | Update profile (multipart) |
| PUT | `/api/auth/change-password` | ✅ | Change password |

---

### 📦 Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | ❌ | List all active categories (with sub-categories) |
| GET | `/api/categories/:id` | ❌ | Get single category |
| GET | `/api/admin/categories` | 🔒 Admin | List all categories (incl. inactive) |
| POST | `/api/admin/categories` | 🔒 Admin | Create category (multipart: image) |
| PUT | `/api/admin/categories/:id` | 🔒 Admin | Update category |
| DELETE | `/api/admin/categories/:id` | 🔒 Admin | Deactivate category |

---

### 🛕 Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | ❌ | List products (filter/search/paginate) |
| GET | `/api/products/:slug` | ❌ | Get product + reviews |
| GET | `/api/admin/products` | 🔒 Admin | Admin product list |
| POST | `/api/admin/products` | 🔒 Admin | Create product (multipart: images[]) |
| PUT | `/api/admin/products/:id` | 🔒 Admin | Update product |
| DELETE | `/api/admin/products/:id` | 🔒 Admin | Deactivate product |
| DELETE | `/api/admin/products/images/:imageId` | 🔒 Admin | Delete product image |

**Product Query Params:**
```
GET /api/products?page=1&limit=12&category_id=1&search=ganesha
                 &min_price=500&max_price=5000&deity=Ganesha
                 &is_featured=true&is_bestseller=true
                 &sort=price&order=ASC
```

---

### 🛒 Cart

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cart` | ✅ | Get cart with subtotal |
| POST | `/api/cart` | ✅ | Add item to cart |
| PUT | `/api/cart/:id` | ✅ | Update item quantity |
| DELETE | `/api/cart/:id` | ✅ | Remove single item |
| DELETE | `/api/cart` | ✅ | Clear entire cart |

**Add to cart body:**
```json
{ "product_id": 1, "quantity": 2 }
```

---

### 📋 Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | ✅ | Place order from cart |
| GET | `/api/orders` | ✅ | My orders (paginated) |
| GET | `/api/orders/:id` | ✅ | Order detail |
| PUT | `/api/orders/:id/cancel` | ✅ | Cancel order |
| GET | `/api/admin/orders` | 🔒 Admin | All orders (filter by status) |
| GET | `/api/admin/orders/:id` | 🔒 Admin | Order detail (admin) |
| PUT | `/api/admin/orders/:id/status` | 🔒 Admin | Update order status |
| GET | `/api/admin/dashboard/stats` | 🔒 Admin | Sales dashboard stats |

**Place order body:**
```json
{
  "address_id": 1,
  "payment_method": "razorpay",
  "coupon_code": "WELCOME10",
  "notes": "Please pack carefully"
}
```

**Update order status body (admin):**
```json
{
  "status": "shipped",
  "tracking_number": "DTDC123456789",
  "shipping_carrier": "DTDC"
}
```

**Order status flow:**
```
pending → confirmed → processing → shipped → out_for_delivery → delivered
                                                              ↘ cancelled
                                                              ↘ return_requested → returned
```

---

### 💳 Payments (Razorpay)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/create-order` | ✅ | Create Razorpay order |
| POST | `/api/payments/verify` | ✅ | Verify payment signature |
| POST | `/api/payments/webhook` | ❌ | Razorpay webhook handler |
| GET | `/api/admin/payments` | 🔒 Admin | List all payments |
| POST | `/api/admin/payments/refund/:paymentId` | 🔒 Admin | Initiate refund |

#### Complete Checkout Flow

```
1. POST /api/orders              → creates order, returns { order_id }
2. POST /api/payments/create-order  { order_id }
   → returns { razorpay_order_id, amount, key_id }
3. Open Razorpay checkout modal on frontend
4. On success: POST /api/payments/verify
   { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id }
   → order marked as "confirmed" + payment as "paid"
```

#### Frontend Razorpay Integration (React example):

```javascript
const handlePayment = async (orderId) => {
  // Step 1: Create Razorpay order
  const { data } = await axios.post('/api/payments/create-order',
    { order_id: orderId },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // Step 2: Open Razorpay modal
  const options = {
    key: data.data.key_id,
    amount: data.data.amount,
    currency: data.data.currency,
    name: 'Idol Blessings Hub',
    description: `Order #${data.data.order_number}`,
    order_id: data.data.razorpay_order_id,
    prefill: data.data.prefill,
    theme: { color: '#FF6B35' },
    handler: async (response) => {
      // Step 3: Verify payment
      await axios.post('/api/payments/verify', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        order_id: orderId
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert('Payment Successful! Order Confirmed.');
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};
```

---

### ⭐ Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/reviews` | ✅ | Submit review |
| GET | `/api/admin/reviews` | 🔒 Admin | All reviews (filter by approval) |
| PUT | `/api/admin/reviews/:id` | 🔒 Admin | Approve / reply to review |
| DELETE | `/api/admin/reviews/:id` | 🔒 Admin | Delete review |

---

### ❤️ Wishlist

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wishlist` | ✅ | Get my wishlist |
| POST | `/api/wishlist` | ✅ | Toggle (add/remove) product |

---

### 📍 Addresses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/addresses` | ✅ | Get my addresses |
| POST | `/api/addresses` | ✅ | Add address |
| PUT | `/api/addresses/:id` | ✅ | Update address |
| DELETE | `/api/addresses/:id` | ✅ | Delete address |

---

### 🎟️ Coupons

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/coupons/validate` | ✅ | Validate coupon + get discount |
| GET | `/api/admin/coupons` | 🔒 Admin | List all coupons |
| POST | `/api/admin/coupons` | 🔒 Admin | Create coupon |
| PUT | `/api/admin/coupons/:id` | 🔒 Admin | Update coupon |
| DELETE | `/api/admin/coupons/:id` | 🔒 Admin | Delete coupon |

**Seeded Coupons:**
| Code | Type | Value | Min Order |
|------|------|-------|-----------|
| `WELCOME10` | 10% off | max ₹200 | ₹500 |
| `FLAT150` | ₹150 off | fixed | ₹999 |
| `DIWALI20` | 20% off | max ₹500 | ₹1500 |

---

### 🖼️ Banners

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/banners?position=hero` | ❌ | Get active banners |
| GET | `/api/admin/banners` | 🔒 Admin | All banners |
| POST | `/api/admin/banners` | 🔒 Admin | Create banner (multipart: image) |
| PUT | `/api/admin/banners/:id` | 🔒 Admin | Update banner |
| DELETE | `/api/admin/banners/:id` | 🔒 Admin | Delete banner |

---

### 👥 User Management (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | 🔒 Admin | List customers |
| PUT | `/api/admin/users/:id/toggle` | 🔒 Admin | Activate/deactivate user |

---

### 🔔 Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | ✅ | Get my notifications |
| PUT | `/api/notifications/:id/read` | ✅ | Mark as read |
| POST | `/api/admin/notifications` | 🔒 Admin | Broadcast notification |

---

## 🗄️ Database Schema (14 Tables)

```
users              — customers & admins
categories         — product categories (self-referencing for sub-categories)
products           — idol & puja products
product_images     — multiple images per product
addresses          — user shipping addresses
carts              — shopping cart items
coupons            — discount coupon definitions
orders             — placed orders (with address snapshot)
order_items        — line items per order (with product snapshot)
payments           — Razorpay transaction records
reviews            — product reviews (with approval workflow)
wishlists          — user wishlist items
banners            — homepage slider/promo banners
notifications      — user & broadcast notifications
```

---

## 💰 Pricing Logic

| Condition | Shipping |
|-----------|---------|
| Order ≥ ₹999 | FREE |
| Order ₹499–₹998 | ₹49 |
| Order < ₹499 | ₹99 |

- **GST:** 18% on (subtotal − discount + shipping)
- **Total:** subtotal − discount + shipping + tax

---

## 🔒 Security Features

- Passwords hashed with **bcryptjs** (12 salt rounds)
- **JWT** authentication with expiry
- Razorpay **HMAC-SHA256 signature verification**
- Admin-only routes protected by role middleware
- Stock validation on every cart/order operation
- Address ownership validation
- Order ownership validation

---

## 🛠️ npm Scripts

```bash
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start production server
node seeders/seed.js   # Seed admin + sample data
```

---

## 🧪 Testing with Postman / Thunder Client

Import this base URL: `http://localhost:5000/api`

**Quick test flow:**
1. `POST /auth/admin/login` → copy token
2. `GET /categories` → view seeded categories
3. `GET /products` → view seeded products
4. `POST /auth/register` → create test customer
5. `POST /auth/login` → get customer token
6. `POST /cart` → add item
7. `POST /addresses` → add address
8. `POST /orders` → place order
9. `POST /payments/create-order` → get Razorpay order
10. `POST /payments/verify` → complete payment

---

## 🚀 Razorpay Webhook Setup (Production)

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add URL: `https://yourdomain.com/api/payments/webhook`
3. Select events: `payment.captured`, `payment.failed`, `refund.created`
4. Copy webhook secret → add to `.env` as `RAZORPAY_WEBHOOK_SECRET`

---

## 📞 Support

- Admin Email: `admin.mipar@gmail.com`
- Admin Password: `admin123`
- Health Check: `GET http://localhost:5000/health`
