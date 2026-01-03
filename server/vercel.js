const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Создаем приложение для Vercel
const app = express();

// Trust proxy для Vercel
app.set('trust proxy', 1);

// Базовый CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Базовый middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Импортируем роуты с try-catch
let productsRouter, ordersRouter, usersRouter, statsRouter, adminRouter;

try {
  productsRouter = require('./routes/products');
  app.use('/api/products', productsRouter);
} catch (e) {
  console.warn('Products router failed:', e.message);
}

try {
  ordersRouter = require('./routes/orders');
  app.use('/api/orders', ordersRouter);
} catch (e) {
  console.warn('Orders router failed:', e.message);
}

try {
  usersRouter = require('./routes/users');
  app.use('/api/users', usersRouter);
} catch (e) {
  console.warn('Users router failed:', e.message);
}

try {
  statsRouter = require('./routes/stats');
  app.use('/api/stats', statsRouter);
} catch (e) {
  console.warn('Stats router failed:', e.message);
}

try {
  adminRouter = require('./routes/admin');
  app.use('/admin', adminRouter);
} catch (e) {
  console.warn('Admin router failed:', e.message);
}

// Базовые эндпоинты
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Debug route working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown'
  });
});

// Fallback для всех остальных запросов
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Обработка ошибок
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Экспорт для Vercel
module.exports = app;
