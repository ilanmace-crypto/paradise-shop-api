const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Подключаем Neon базу данных
const pool = require('./config/neon');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Health check с проверкой Neon БД
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'Neon PostgreSQL connected',
      db_time: result.rows[0].current_time,
      db_version: result.rows[0].db_version
    });
  } catch (error) {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'Neon PostgreSQL disconnected',
      error: error.message
    });
  }
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Debug working with Neon',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    has_db: !!process.env.DATABASE_URL
  });
});

// Admin login с Neon БД
app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Пробуем Neon базу данных
    try {
      const result = await pool.query(
        'SELECT * FROM admins WHERE username = $1',
        [username]
      );
      
      if (result.rows.length > 0) {
        const admin = result.rows[0];
        if (password === 'paradise251208') {
          const token = 'neon-token-' + Date.now() + '-' + Math.random().toString(36).substring(2);
          return res.json({
            token,
            admin: {
              id: admin.id,
              username: admin.username,
              role: admin.role
            }
          });
        }
      }
    } catch (dbError) {
      console.warn('Neon DB error, using fallback:', dbError.message);
    }

    // Fallback
    if (username === 'admin' && password === 'paradise251208') {
      const token = 'fallback-token-' + Date.now() + '-' + Math.random().toString(36).substring(2);
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Products с Neon БД
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `);
    
    // Получаем вкусы для каждого товара
    for (let product of result.rows) {
      const flavors = await pool.query(
        'SELECT * FROM product_flavors WHERE product_id = $1',
        [product.id]
      );
      product.flavors = flavors.rows;
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Products error:', error);
    // Fallback с mock данными
    res.json([
      {
        id: '1',
        name: 'Test Liquid',
        price: 25,
        stock: 10,
        category: 'liquids',
        category_name: 'Жидкости',
        flavors: []
      }
    ]);
  }
});

// Orders с Neon БД
app.post('/api/orders', async (req, res) => {
  try {
    const { items, telegram_user } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing items' });
    }

    // Создаем заказ в Neon
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const orderResult = await client.query(`
        INSERT INTO orders (user_id, total_amount, telegram_id, telegram_username)
        VALUES (NULL, $1, $2, $3)
        RETURNING *
      `, [
        items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        telegram_user?.telegram_id || null,
        telegram_user?.telegram_username || null
      ]);
      
      const order = orderResult.rows[0];
      
      // Добавляем товары заказа
      for (const item of items) {
        await client.query(`
          INSERT INTO order_items (order_id, product_id, flavor_name, quantity, price)
          VALUES ($1, $2, $3, $4, $5)
        `, [order.id, item.product_id, item.flavor_name || null, item.quantity, item.price]);
      }
      
      await client.query('COMMIT');
      
      res.json({
        id: order.id,
        status: 'created',
        message: 'Order created successfully in Neon'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = app;
