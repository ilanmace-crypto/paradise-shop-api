const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Mock database
const mockData = {
  users: new Map(),
  products: [
    {
      id: 'liq-1',
      name: 'PARADISE Liquid 30ml',
      category_id: 1,
      price: 25.00,
      description: 'Премиум жидкость 30мг/мл',
      stock: 50,
      is_active: true,
      category_name: 'Жидкости',
      category_slug: 'liquids',
      flavors: [
        { flavor_name: 'Mango Ice', stock: 15 },
        { flavor_name: 'Blueberry', stock: 12 },
        { flavor_name: 'Cola Lime', stock: 10 },
        { flavor_name: 'Grape', stock: 8 },
        { flavor_name: 'Strawberry Kiwi', stock: 5 }
      ]
    },
    {
      id: 'liq-2',
      name: 'Salt 20mg 30ml',
      category_id: 1,
      price: 28.00,
      description: 'Солевая никотиновая жидкость',
      stock: 40,
      is_active: true,
      category_name: 'Жидкости',
      category_slug: 'liquids',
      flavors: [
        { flavor_name: 'Watermelon', stock: 12 },
        { flavor_name: 'Apple', stock: 10 },
        { flavor_name: 'Energy', stock: 8 },
        { flavor_name: 'Peach Ice', stock: 10 }
      ]
    },
    {
      id: 'liq-3',
      name: 'Premium Mix 60ml',
      category_id: 1,
      price: 45.00,
      description: 'Большой флакон премиум жидкости',
      stock: 30,
      is_active: true,
      category_name: 'Жидкости',
      category_slug: 'liquids',
      flavors: [
        { flavor_name: 'Vanilla Custard', stock: 8 },
        { flavor_name: 'Tobacco', stock: 10 },
        { flavor_name: 'Berry Mix', stock: 12 }
      ]
    },
    {
      id: 'con-1',
      name: 'Картридж (POD) 1.0Ω',
      category_id: 2,
      price: 12.00,
      description: 'Заменяемый картридж для POD систем',
      stock: 100,
      is_active: true,
      category_name: 'Расходники',
      category_slug: 'consumables',
      flavors: []
    },
    {
      id: 'con-2',
      name: 'Испаритель 0.6Ω',
      category_id: 2,
      price: 15.00,
      description: 'Коил для субомных систем',
      stock: 80,
      is_active: true,
      category_name: 'Расходники',
      category_slug: 'consumables',
      flavors: []
    },
    {
      id: 'con-3',
      name: 'Вата + проволока (сет)',
      category_id: 2,
      price: 18.00,
      description: 'Набор для самостоятельной намотки',
      stock: 60,
      is_active: true,
      category_name: 'Расходники',
      category_slug: 'consumables',
      flavors: []
    },
    {
      id: 'con-4',
      name: 'Сет картриджей (2шт)',
      category_id: 2,
      price: 20.00,
      description: 'Упаковка из 2 картриджей',
      stock: 50,
      is_active: true,
      category_name: 'Расходники',
      category_slug: 'consumables',
      flavors: []
    }
  ],
  categories: [
    { id: 1, name: 'Жидкости', slug: 'liquids', description: 'Жидкости для электронных сигарет' },
    { id: 2, name: 'Расходники', slug: 'consumables', description: 'Картриджи, испарители и другие расходные материалы' }
  ],
  orders: new Map(),
  reviews: [
    {
      id: 1,
      user_id: 1,
      product_id: 'liq-1',
      rating: 5,
      review_text: 'Отличная жидкость, очень вкусно!',
      telegram_username: '@user1',
      is_approved: true,
      product_name: 'PARADISE Liquid 30ml',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      user_id: 2,
      product_id: 'liq-2',
      rating: 4,
      review_text: 'Хорошо, но могло быть лучше',
      telegram_username: '@user2',
      is_approved: true,
      product_name: 'Salt 20mg 30ml',
      created_at: new Date().toISOString()
    }
  ],
  admins: [
    {
      id: 1,
      username: 'admin',
      password_hash: '$2b$10$xB5/dVE0Sq5sWZSvQ1e/OOBf3jdWTyHICN4pKgxkQyYuBqc7bIOFC',
      role: 'super_admin',
      last_login: null
    }
  ],
  nextOrderId: 1,
  nextUserId: 1,
  nextReviewId: 3
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Helper functions
const generateToken = (username, role = 'admin') => {
  return jwt.sign(
    { username, role },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '24h' }
  );
};

// API Routes
app.get('/api/products', (req, res) => {
  res.json(mockData.products);
});

app.get('/api/categories', (req, res) => {
  res.json(mockData.categories);
});

app.post('/api/users/telegram', (req, res) => {
  const { telegram_id, username, first_name, last_name } = req.body;
  
  let user = mockData.users.get(telegram_id);
  if (!user) {
    user = {
      id: mockData.nextUserId++,
      telegram_id,
      telegram_username: username,
      telegram_first_name: first_name,
      telegram_last_name: last_name,
      created_at: new Date().toISOString()
    };
    mockData.users.set(telegram_id, user);
  } else {
    user.telegram_username = username;
    user.telegram_first_name = first_name;
    user.telegram_last_name = last_name;
  }
  
  res.json(user);
});

app.post('/api/orders', (req, res) => {
  const { user_id, items, delivery_address, phone, notes } = req.body;
  
  let total_amount = 0;
  for (let item of items) {
    total_amount += item.price * item.quantity;
  }
  
  const order = {
    id: mockData.nextOrderId++,
    user_id,
    total_amount,
    status: 'pending',
    delivery_address,
    phone,
    notes,
    items: items.map(item => ({
      product_id: item.id,
      product_name: item.name,
      flavor_name: item.flavor_name,
      quantity: item.quantity,
      price: item.price
    })),
    created_at: new Date().toISOString()
  };
  
  mockData.orders.set(order.id, order);
  res.json(order);
});

app.get('/api/reviews', (req, res) => {
  res.json(mockData.reviews.filter(r => r.is_approved));
});

app.post('/api/reviews', (req, res) => {
  const { user_id, product_id, rating, review_text, telegram_username } = req.body;
  
  const review = {
    id: mockData.nextReviewId++,
    user_id,
    product_id,
    rating,
    review_text,
    telegram_username,
    is_approved: false,
    created_at: new Date().toISOString()
  };
  
  mockData.reviews.push(review);
  res.json(review);
});

app.get('/api/orders/user/:telegram_id', (req, res) => {
  const { telegram_id } = req.params;
  const user = mockData.users.get(telegram_id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const userOrders = Array.from(mockData.orders.values())
    .filter(order => order.user_id === user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.json(userOrders);
});

// Admin Routes
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  const admin = mockData.admins.find(a => a.username === username);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const isValid = await bcrypt.compare(password, admin.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  admin.last_login = new Date().toISOString();
  
  const token = generateToken(admin.username, admin.role);
  res.json({
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      role: admin.role
    }
  });
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

app.get('/admin/stats', authenticateToken, (req, res) => {
  const orders = Array.from(mockData.orders.values());
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  res.json({
    orders: {
      total_orders: orders.length,
      total_revenue: orders.reduce((sum, o) => sum + o.total_amount, 0),
      completed_orders: completedOrders.length,
      pending_orders: orders.filter(o => o.status === 'pending').length
    },
    users: { count: mockData.users.size },
    products: { count: mockData.products.length },
    reviews: { count: mockData.reviews.filter(r => r.is_approved).length }
  });
});

app.get('/admin/orders', authenticateToken, (req, res) => {
  const orders = Array.from(mockData.orders.values())
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.json(orders.map(order => {
    const user = Array.from(mockData.users.values())
      .find(u => u.id === order.user_id);
    
    return {
      ...order,
      telegram_username: user?.telegram_username || 'Unknown',
      telegram_first_name: user?.telegram_first_name || ''
    };
  }));
});

app.put('/admin/orders/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const order = mockData.orders.get(parseInt(id));
  if (order) {
    order.status = status;
    order.updated_at = new Date().toISOString();
  }
  
  res.json({ message: 'Order status updated' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
