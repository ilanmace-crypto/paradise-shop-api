const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/paradise_shop.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Создаем таблицы последовательно
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE NOT NULL,
      telegram_username TEXT,
      telegram_first_name TEXT,
      telegram_last_name TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category_id INTEGER,
      price REAL NOT NULL,
      description TEXT,
      image_url TEXT,
      stock INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS product_flavors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      flavor_name TEXT NOT NULL,
      stock INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE (product_id, flavor_name)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      delivery_address TEXT,
      phone TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      flavor_name TEXT,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id TEXT,
      rating INTEGER DEFAULT 5,
      review_text TEXT,
      telegram_username TEXT,
      is_approved BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )`);

    // Вставляем начальные данные после создания всех таблиц
    setTimeout(() => insertInitialData(), 100);
  });
}

function insertInitialData() {
  const bcrypt = require('bcrypt');
  
  // Категории
  db.run(`INSERT OR IGNORE INTO categories (name, slug, description) VALUES 
    ('Жидкости', 'liquids', 'Жидкости для электронных сигарет'),
    ('Расходники', 'consumables', 'Картриджи, испарители и другие расходные материалы')`, (err) => {
    if (err) console.error('Error inserting categories:', err);
    
    // Товары
    const products = [
      ['liq-1', 'PARADISE Liquid 30ml', 1, 25.00, 'Премиум жидкость 30мг/мл', null, 50],
      ['liq-2', 'Salt 20mg 30ml', 1, 28.00, 'Солевая никотиновая жидкость', null, 40],
      ['liq-3', 'Premium Mix 60ml', 1, 45.00, 'Большой флакон премиум жидкости', null, 30],
      ['con-1', 'Картридж (POD) 1.0Ω', 2, 12.00, 'Заменяемый картридж для POD систем', null, 100],
      ['con-2', 'Испаритель 0.6Ω', 2, 15.00, 'Коил для субомных систем', null, 80],
      ['con-3', 'Вата + проволока (сет)', 2, 18.00, 'Набор для самостоятельной намотки', null, 60],
      ['con-4', 'Сет картриджей (2шт)', 2, 20.00, 'Упаковка из 2 картриджей', null, 50]
    ];

    const insertProduct = db.prepare(`INSERT OR IGNORE INTO products (id, name, category_id, price, description, image_url, stock) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      products.forEach((product, index) => {
      insertProduct.run(product, (err) => {
        if (err) console.error('Error inserting product:', err);
        
        // Вкусы для жидкостей (вставляем после товаров)
        if (index === products.length - 1) {
          const flavors = [
            ['liq-1', 'Mango Ice', 15],
            ['liq-1', 'Blueberry', 12],
            ['liq-1', 'Cola Lime', 10],
            ['liq-1', 'Grape', 8],
            ['liq-1', 'Strawberry Kiwi', 5],
            ['liq-2', 'Watermelon', 12],
            ['liq-2', 'Apple', 10],
            ['liq-2', 'Energy', 8],
            ['liq-2', 'Peach Ice', 10],
            ['liq-3', 'Vanilla Custard', 8],
            ['liq-3', 'Tobacco', 10],
            ['liq-3', 'Berry Mix', 12]
          ];

          const insertFlavor = db.prepare(`INSERT OR IGNORE INTO product_flavors (product_id, flavor_name, stock) VALUES (?, ?, ?)`);
          flavors.forEach((flavor, fIndex) => {
            insertFlavor.run(flavor, (err) => {
              if (err) console.error('Error inserting flavor:', err);
              
              // Админ (вставляем в самом конце)
              if (fIndex === flavors.length - 1) {
                const adminPassword = bcrypt.hashSync('admin123', 10);
                db.run(`INSERT OR IGNORE INTO admins (username, password_hash, role) VALUES (?, ?, ?)`, 
                  ['admin', adminPassword, 'super_admin'], (err) => {
                  if (err) console.error('Error inserting admin:', err);
                  else console.log('Database initialized successfully');
                });
              }
            });
          });
          insertFlavor.finalize();
        }
      });
    });
    insertProduct.finalize();
  });
}

module.exports = db;
