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
          flavors TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (category_id) REFERENCES categories(id)
        )`,
        (err) => {
          if (err) return reject(err);
          console.log('Products table created');

          // На случай уже существующей таблицы без колонки flavors добавляем её через ALTER
          db.run('ALTER TABLE products ADD COLUMN flavors TEXT', (alterErr) => {
            if (alterErr && !String(alterErr.message).includes('duplicate column name')) {
              console.error('Failed to add flavors column:', alterErr);
            }
          });
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
      // Seed categories
      const categories = [
        { name: 'Жидкости', description: 'Жидкости для вейпинга' },
        { name: 'Картриджи', description: 'Сменные картриджи' },
        { name: 'Одноразовые', description: 'Одноразовые вейпы' }
      ];

      categories.forEach(cat => {
        db.get(
          "SELECT id FROM categories WHERE name = ?",
          [cat.name],
          (err, row) => {
            if (err) return reject(err);

            if (!row) {
              db.run(
                "INSERT INTO categories (name, description) VALUES (?, ?)",
                [cat.name, cat.description],
                (insertErr) => {
                  if (insertErr) return reject(insertErr);
                  console.log(`Category created: ${cat.name}`);
                }
              );
            }
          }
        );
      });

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

      resolve();
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

// Create product
app.post('/api/products', (req, res) => {
  const { name, description, price, category, category_id, stock, flavors } = req.body;

  // Если передан category (строковый id из фронтенда), ищем соответствующий category_id
  let finalCategoryId = category_id;
  if (!finalCategoryId && category) {
    db.get(
      'SELECT id FROM categories WHERE name = ?',
      [category === 'liquids' ? 'Жидкости' : category === 'cartridges' ? 'Картриджи' : category === 'disposable' ? 'Одноразовые' : category],
      (err, row) => {
        if (err) {
          console.error('Error fetching category by name:', err);
          return res.status(500).json({ error: 'Failed to resolve category' });
        }
        finalCategoryId = row ? row.id : null;
        proceedWithCreate();
      }
    );
  } else {
    proceedWithCreate();
  }

  function proceedWithCreate() {
    const flavorsJson = flavors ? JSON.stringify(flavors) : null;

    const sql = `
      INSERT INTO products (name, description, price, category_id, stock, flavors)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(
      sql,
      [name, description || '', price, finalCategoryId, stock ?? 0, flavorsJson],
      function (err) {
        if (err) {
          console.error('Create product error:', err);
          return res.status(500).json({ error: 'Failed to create product' });
        }

        db.get('SELECT * FROM products WHERE id = ?', [this.lastID], (getErr, row) => {
          if (getErr) {
            return res.status(500).json({ error: 'Product created but failed to fetch' });
          }
          res.status(201).json(row);
        });
      }
    );
  }
});

// Update product
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price, category_id, stock, flavors } = req.body;

  const flavorsJson = flavors ? JSON.stringify(flavors) : null;

  const sql = `
    UPDATE products
    SET name = ?, description = ?, price = ?, category_id = ?, stock = ?, flavors = ?
    WHERE id = ?
  `;

  db.run(
    sql,
    [name, description || '', price, category_id || null, stock ?? 0, flavorsJson, id],
    function (err) {
      if (err) {
        console.error('Update product error:', err);
        return res.status(500).json({ error: 'Failed to update product' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      db.get('SELECT * FROM products WHERE id = ?', [id], (getErr, row) => {
        if (getErr) {
          return res.status(500).json({ error: 'Product updated but failed to fetch' });
        }
        res.json(row);
      });
    }
  );
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Delete product error:', err);
      return res.status(500).json({ error: 'Failed to delete product' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(204).send();
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
  const { password } = req.body || {};

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'paradise251208';

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Invalid password' });
  }

  return res.json({
    success: true,
    user: { id: 1, username: 'admin', role: 'admin' }
  });
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

      // Асинхронно обновляем остатки по вкусам для жидкостей
      try {
        updateProductStocksFromOrder(items);
      } catch (stockErr) {
        console.error('Failed to update product stocks from order:', stockErr);
      }

      res.json({
        success: true,
        order_id: this.lastID,
        message: 'Order created successfully'
      });
    }
  );
});

function updateProductStocksFromOrder(items) {
  if (!Array.isArray(items) || items.length === 0) return;

  items.forEach((item) => {
    // Обновляем только товары-жидкости с конкретным вкусом
    if (!item || item.category !== 'liquids' || !item.flavor || !item.id) {
      return;
    }

    const productId = item.id;
    const flavor = item.flavor;
    const quantity = Number(item.quantity) || 0;

    if (quantity <= 0) {
      return;
    }

    db.get('SELECT id, flavors, stock FROM products WHERE id = ?', [productId], (err, product) => {
      if (err) {
        console.error('Failed to load product for stock update:', err);
        return;
      }
      if (!product) return;

      let flavorsObj = {};
      if (product.flavors) {
        try {
          flavorsObj = JSON.parse(product.flavors);
        } catch (parseErr) {
          console.error('Failed to parse product flavors JSON:', parseErr);
        }
      }

      const currentStock = Number(flavorsObj[flavor] || 0);
      const newStock = Math.max(0, currentStock - quantity);

      if (newStock === 0) {
        delete flavorsObj[flavor];
      } else {
        flavorsObj[flavor] = newStock;
      }

      const remainingStocks = Object.values(flavorsObj).map((v) => Number(v) || 0);
      const totalStock = remainingStocks.length
        ? remainingStocks.reduce((sum, v) => sum + v, 0)
        : 0;

      const updatedFlavorsJson = Object.keys(flavorsObj).length
        ? JSON.stringify(flavorsObj)
        : null;

      db.run(
        'UPDATE products SET flavors = ?, stock = ? WHERE id = ?',
        [updatedFlavorsJson, totalStock, productId],
        (updateErr) => {
          if (updateErr) {
            console.error('Failed to update product stock/flavors:', updateErr);
          }
        }
      );
    });
  });
}

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
