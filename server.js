const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// SQLite database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log('Creating tables...');

      db.run(
        `CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )`,
        (err) => {
          if (err) return reject(err);
          console.log('Categories table created');
        }
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          category_id INTEGER,
          stock INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (category_id) REFERENCES categories(id)
        )`,
        (err) => {
          if (err) return reject(err);
          console.log('Products table created');
        }
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          email TEXT,
          role TEXT DEFAULT 'user',
          created_at TEXT DEFAULT (datetime('now'))
        )`,
        (err) => {
          if (err) return reject(err);
          console.log('Users table created');
        }
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_name TEXT NOT NULL,
          customer_email TEXT,
          customer_phone TEXT,
          items TEXT NOT NULL,
          total_amount REAL NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at TEXT DEFAULT (datetime('now'))
        )`,
        (err) => {
          if (err) return reject(err);
          console.log('Orders table created');

          // Seed default data (admin user, basic categories/products)
          seedDatabase()
            .then(() => {
              console.log('Database initialized successfully');
              resolve();
            })
            .catch((seedErr) => {
              console.error('Database seeding error:', seedErr);
              // всё равно резолвим, чтобы сервер стартовал
              resolve();
            });
        }
      );
    });
  });
}

function seedDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Default admin user
      db.get(
        "SELECT id FROM users WHERE username = ?",
        ['admin'],
        (err, row) => {
          if (err) return reject(err);

          if (!row) {
            db.run(
              `INSERT INTO users (username, password_hash, email, role)
               VALUES (?, ?, ?, ?)`,
              ['admin', 'paradise123', 'admin@example.com', 'admin'],
              (insertErr) => {
                if (insertErr) return reject(insertErr);
                console.log('Default admin user created (admin / paradise123)');
              }
            );
          }
        }
      );

      // Basic categories
      db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
        if (err) return reject(err);

        if (row.count === 0) {
          const stmt = db.prepare(
            'INSERT INTO categories (name, description) VALUES (?, ?)' 
          );
          stmt.run('Clothes', 'Clothing and apparel');
          stmt.run('Accessories', 'Fashion accessories');
          stmt.run('Electronics', 'Electronic devices and gadgets');
          stmt.finalize();
          console.log('Default categories created');
        }
      });

      // Basic products
      db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
        if (err) return reject(err);

        if (row.count === 0) {
          const stmt = db.prepare(
            'INSERT INTO products (name, description, price, category_id, stock) VALUES (?, ?, ?, ?, ?)'
          );
          stmt.run('Basic T-Shirt', 'Comfortable cotton t-shirt', 19.99, 1, 100);
          stmt.run('Stylish Hat', 'Fashionable hat for everyday wear', 29.99, 2, 50);
          stmt.run('Wireless Earbuds', 'Bluetooth earbuds with charging case', 59.99, 3, 30);
          stmt.finalize();
          console.log('Default products created');
        }

        resolve();
      });
    });
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  db.get('SELECT datetime("now") as now', (err, row) => {
    if (err) {
      return res.status(500).json({ status: 'ERROR', error: 'DB error' });
    }
    res.json({ status: 'OK', timestamp: row.now });
  });
});

// API Routes
app.get('/api/products', (req, res) => {
  const sql = `
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.name
  `;

  db.all(sql, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    res.json(rows);
  });
});

app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
    res.json(rows);
  });
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;

  // Простой вариант: пускаем в админку по фиксированному паролю
  // В проде это нужно будет заменить на нормальную проверку из БД/хеша
  if (password === 'paradise123') {
    return res.json({
      success: true,
      user: { id: 1, username: 'admin', role: 'admin' }
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid credentials' });
});

app.post('/api/orders', (req, res) => {
  const { customer_name, customer_email, customer_phone, items, total_amount } = req.body;

  const sql = `
    INSERT INTO orders (customer_name, customer_email, customer_phone, items, total_amount, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `;

  db.run(
    sql,
    [customer_name, customer_email, customer_phone, JSON.stringify(items), total_amount],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, error: 'Failed to create order' });
      }

      res.json({
        success: true,
        order_id: this.lastID,
        message: 'Order created successfully'
      });
    }
  );
});

// Start server
async function startServer() {
  try {
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
