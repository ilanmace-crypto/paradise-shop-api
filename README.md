# Paradise Shop

Vape liquids and consumables shop with Telegram integration.

## Setup

### 1. Database Setup
1. Create Neon PostgreSQL project
2. Run the schema.sql file in Neon SQL Editor
3. Copy the DATABASE_URL from Neon dashboard

### 2. Environment Variables (Vercel)
Set these in Vercel Environment Variables:
- `DATABASE_URL` - Your Neon connection string
- `TELEGRAM_BOT_TOKEN` - Optional, for Telegram notifications
- `TELEGRAM_GROUP_CHAT_ID` - Optional, for order notifications

### 3. Frontend Setup
```bash
cd client
npm install
npm run build
```

### 4. Deploy to Vercel
```bash
git add .
git commit -m "Initial deploy"
git push origin main
```

## Features
- Product catalog with images (stored in DB as base64)
- Flavor stock management for liquids
- Order creation with stock validation
- Admin panel (user: admin, password: paradise251208)
- Telegram integration (optional)
- Reviews system
- Responsive design

## API Endpoints
- `GET /api/products` - Get all active products
- `GET /api/reviews/:productId` - Get product reviews
- `POST /api/orders` - Create order
- `GET /admin/products` - Admin: Get all products
- `POST /admin/products` - Admin: Create product
- `PUT /admin/products/:id` - Admin: Update product
- `DELETE /admin/products/:id` - Admin: Delete product
- `GET /api/debug` - Debug information

## Database Schema
- `categories` - Product categories
- `products` - Main products
- `product_flavors` - Flavors for liquids with stock
- `product_images` - Product images (base64)
- `users` - User accounts (Telegram integration)
- `orders` - Customer orders
- `order_items` - Items in orders
- `reviews` - Product reviews

## Admin Access
URL: `/admin`
Username: `admin`
Password: `paradise251208`
