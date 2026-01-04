const express = require('express');
const cors = require('cors');
 const path = require('path');
 const crypto = require('crypto');

const app = express();

 const projectRoot = path.join(__dirname, '..');

 let products = [
  {
    id: '1',
    name: 'Test Liquid',
    price: 25,
    stock: 10,
    category_id: 1,
    category_name: 'Жидкости',
    flavors: [],
  },
 ];

 let orders = [];

 const requireAdminAuth = (req, res, next) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
 };

// Set CSP headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline' blob:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss: blob:; worker-src 'self' blob:; media-src 'self' blob:; manifest-src 'self';"
  );
  next();
});

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Serve static files from root
app.use(express.static(path.join(projectRoot, 'public')));
app.use(express.static(projectRoot));
app.use('/assets', express.static(path.join(projectRoot, 'assets')));

// Favicon handler
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Vite.svg handler
app.get('/vite.svg', (req, res) => {
  res.sendFile(path.join(projectRoot, 'vite.svg'));
});

// Root route handler - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(projectRoot, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Debug working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Mock products endpoint
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Aliases (some parts of the frontend can call without /api)
app.get('/products', (req, res) => {
  res.json(products);
});

// Create order
app.post('/api/orders', (req, res) => {
  const { items, telegram_user } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing items' });
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item?.price || 0) * Number(item?.quantity || item?.qty || 0),
    0
  );

  const order = {
    id: crypto.randomUUID(),
    items,
    telegram_user: telegram_user || null,
    total_amount: totalAmount,
    status: 'created',
    created_at: new Date().toISOString(),
  };

  orders.push(order);
  res.json({ id: order.id, status: order.status, message: 'Order created', total_amount: order.total_amount });
});

app.post('/orders', (req, res) => {
  return app._router.handle({ ...req, url: '/api/orders' }, res, () => {});
});

// Mock admin login
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'paradise251208') {
    const token = 'token-' + Date.now() + '-' + Math.random().toString(36).substring(2);
    return res.json({
      token,
      admin: {
        id: 1,
        username: 'admin',
        role: 'admin'
      }
    });
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

// Admin products CRUD (minimal in-memory implementation)
app.get('/admin/products', requireAdminAuth, (req, res) => {
  res.json(products);
});

app.post('/admin/products', requireAdminAuth, (req, res) => {
  const { name, category_id, price, description, stock, flavors, image_url } = req.body || {};

  if (!name || price === undefined || price === null) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const resolvedCategoryId = Number(category_id) || 1;

  const product = {
    id: crypto.randomUUID(),
    name,
    category_id: resolvedCategoryId,
    price: Number(price),
    description: description || null,
    stock: Number(stock || 0),
    image_url: image_url || null,
    flavors: Array.isArray(flavors)
      ? flavors.map((f) => ({
        flavor_name: f?.flavor_name || f?.name || String(f || ''),
        stock: Number(f?.stock ?? 0),
      })).filter((f) => f.flavor_name)
      : [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  products.push(product);
  res.json(product);
});

app.put('/admin/products/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const idx = products.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  const { name, category_id, price, description, stock, flavors, image_url } = req.body || {};
  if (!name || price === undefined || price === null) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  products[idx] = {
    ...products[idx],
    name,
    category_id: Number(category_id) || products[idx].category_id,
    price: Number(price),
    description: description || null,
    stock: Number(stock || 0),
    image_url: image_url || null,
    flavors: Array.isArray(flavors)
      ? flavors.map((f) => ({
        flavor_name: f?.flavor_name || f?.name || String(f || ''),
        stock: Number(f?.stock ?? 0),
      })).filter((f) => f.flavor_name)
      : [],
    updated_at: new Date().toISOString(),
  };

  res.json(products[idx]);
});

app.delete('/admin/products/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const idx = products.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  products.splice(idx, 1);
  res.json({ success: true });
});

// Catch-all handler for React Router
app.get(/.*/, (req, res) => {
  // Don't intercept API routes
  if (req.path.startsWith('/api') || req.path.startsWith('/admin') || req.path === '/health') {
    return res.status(404).json({ error: 'Route not found' });
  }
  res.sendFile(path.join(projectRoot, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

module.exports = app;
