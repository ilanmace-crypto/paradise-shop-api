const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize database
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(100),
        customer_phone VARCHAR(20),
        items TEXT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample data if tables are empty
    const categoryCount = await pool.query('SELECT COUNT(*) FROM categories');
    if (parseInt(categoryCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO categories (name, description) VALUES 
        ('Электроника', 'Современные электронные устройства'),
        ('Одежда', 'Модная одежда для всех'),
        ('Книги', 'Книги на любой вкус')
      `);
    }

    const productCount = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(productCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO products (name, description, price, category_id, stock) VALUES 
        ('Смартфон', 'Современный смартфон с отличной камерой', 299.99, 1, 50),
        ('Ноутбук', 'Мощный ноутбук для работы и игр', 899.99, 1, 25),
        ('Футболка', 'Хлопковая футболка классического дизайна', 19.99, 2, 100),
        ('Джинсы', 'Удобные джинсы из денима', 49.99, 2, 75),
        ('Роман', 'Увлекательный роман современного автора', 14.99, 3, 200)
      `);
    }

    const userCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    if (parseInt(userCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO users (username, password_hash, email, role) VALUES 
        ('admin', 'admin123', 'admin@paradise-shop.com', 'admin')
      `);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// API Routes
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND role = $2',
      [username, 'admin']
    );
    
    const user = result.rows[0];
    if (user && user.password_hash === password) {
      res.json({ 
        success: true, 
        user: { id: user.id, username: user.username, role: user.role }
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, items, total_amount } = req.body;
    
    const result = await pool.query(`
      INSERT INTO orders (customer_name, customer_email, customer_phone, items, total_amount, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `, [customer_name, customer_email, customer_phone, JSON.stringify(items), total_amount]);
    
    res.json({ 
      success: true, 
      order_id: result.rows[0].id,
      message: 'Order created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// Start server
async function startServer() {
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connected');
    
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
