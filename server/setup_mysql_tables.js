const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function setupTables() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'paradise_shop'
    });

    console.log('Connected to MySQL successfully');

    // Создаем таблицы
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        category_id INT,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        stock INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS product_flavors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id VARCHAR(50) NOT NULL,
        flavor_name VARCHAR(100) NOT NULL,
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE (product_id, flavor_name)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegram_id VARCHAR(100) UNIQUE NOT NULL,
        telegram_username VARCHAR(100),
        telegram_first_name VARCHAR(100),
        telegram_last_name VARCHAR(100),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        delivery_address TEXT,
        phone VARCHAR(20),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id VARCHAR(50) NOT NULL,
        flavor_name VARCHAR(100),
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id VARCHAR(50),
        rating INT DEFAULT 5,
        review_text TEXT,
        telegram_username VARCHAR(100),
        is_approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL
      )
    `);

    console.log('Tables created successfully');

    // Вставляем начальные данные
    await connection.execute(`
      INSERT IGNORE INTO categories (name, slug, description) VALUES 
      ('Жидкости', 'liquids', 'Жидкости для электронных сигарет'),
      ('Расходники', 'consumables', 'Картриджи, испарители и другие расходные материалы')
    `);

    const products = [
      ['liq-1', 'PARADISE Liquid 30ml', 1, 25.00, 'Премиум жидкость 30мг/мл', null, 50],
      ['liq-2', 'Salt 20mg 30ml', 1, 28.00, 'Солевая никотиновая жидкость', null, 40],
      ['liq-3', 'Premium Mix 60ml', 1, 45.00, 'Большой флакон премиум жидкости', null, 30],
      ['con-1', 'Картридж (POD) 1.0Ω', 2, 12.00, 'Заменяемый картридж для POD систем', null, 100],
      ['con-2', 'Испаритель 0.6Ω', 2, 15.00, 'Коил для субомных систем', null, 80],
      ['con-3', 'Вата + проволока (сет)', 2, 18.00, 'Набор для самостоятельной намотки', null, 60],
      ['con-4', 'Сет картриджей (2шт)', 2, 20.00, 'Упаковка из 2 картриджей', null, 50]
    ];

    for (const product of products) {
      await connection.execute(`
        INSERT IGNORE INTO products (id, name, category_id, price, description, image_url, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, product);
    }

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

    for (const flavor of flavors) {
      await connection.execute(`
        INSERT IGNORE INTO product_flavors (product_id, flavor_name, stock)
        VALUES (?, ?, ?)
      `, flavor);
    }

    const adminPassword = await bcrypt.hash('admin123', 10);
    await connection.execute(`
      INSERT IGNORE INTO admins (username, password_hash, role)
      VALUES (?, ?, ?)
    `, ['admin', adminPassword, 'super_admin']);

    console.log('Initial data inserted successfully');
    console.log('MySQL setup completed!');

    await connection.end();

  } catch (error) {
    console.error('Setup failed:', error.message);
    console.log('\nCheck your .env file:');
    console.log('DB_HOST=' + (process.env.DB_HOST || 'not set'));
    console.log('DB_PORT=' + (process.env.DB_PORT || 'not set'));
    console.log('DB_USER=' + (process.env.DB_USER || 'not set'));
    console.log('DB_PASSWORD=' + (process.env.DB_PASSWORD ? '***' : 'not set'));
    console.log('DB_NAME=' + (process.env.DB_NAME || 'not set'));
  }
}

setupTables();
