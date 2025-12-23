-- Создание базы данных
CREATE DATABASE IF NOT EXISTS paradise_shop;
USE paradise_shop;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    telegram_id VARCHAR(50) UNIQUE NOT NULL,
    telegram_username VARCHAR(100),
    telegram_first_name VARCHAR(100),
    telegram_last_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Таблица категорий
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица товаров
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category_id INT,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    stock INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Таблица вкусов для жидкостей
CREATE TABLE IF NOT EXISTS product_flavors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    flavor_name VARCHAR(100) NOT NULL,
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_flavor (product_id, flavor_name)
);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
    delivery_address TEXT,
    phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Таблица товаров в заказах
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    flavor_name VARCHAR(100),
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Таблица отзывов
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT,
    rating INT DEFAULT 5,
    review_text TEXT,
    telegram_username VARCHAR(100),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Таблица админов
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'manager') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Вставка начальных данных
INSERT IGNORE INTO categories (name, slug, description) VALUES
('Жидкости', 'liquids', 'Жидкости для электронных сигарет'),
('Расходники', 'consumables', 'Картриджи, испарители и другие расходные материалы');

INSERT IGNORE INTO products (name, category_id, price, description, stock) VALUES
('PARADISE Liquid 30ml', 1, 25.00, 'Премиум жидкость 30мг/мл', 50),
('Salt 20mg 30ml', 1, 28.00, 'Солевая никотиновая жидкость', 40),
('Premium Mix 60ml', 1, 45.00, 'Большой флакон премиум жидкости', 30),
('Картридж (POD) 1.0Ω', 2, 12.00, 'Заменяемый картридж для POD систем', 100),
('Испаритель 0.6Ω', 2, 15.00, 'Коил для субомных систем', 80),
('Вата + проволока (сет)', 2, 18.00, 'Набор для самостоятельной намотки', 60),
('Сет картриджей (2шт)', 2, 20.00, 'Упаковка из 2 картриджей', 50);

-- Вставка вкусов для жидкостей
INSERT IGNORE INTO product_flavors (product_id, flavor_name, stock) VALUES
(1, 'Mango Ice', 15),
(1, 'Blueberry', 12),
(1, 'Cola Lime', 10),
(1, 'Grape', 8),
(1, 'Strawberry Kiwi', 5),
(2, 'Watermelon', 12),
(2, 'Apple', 10),
(2, 'Energy', 8),
(2, 'Peach Ice', 10),
(3, 'Vanilla Custard', 8),
(3, 'Tobacco', 10),
(3, 'Berry Mix', 12);

-- Создание админа по умолчанию (пароль: admin123)
INSERT IGNORE INTO admins (username, password_hash, role) VALUES
('admin', '$2b$10$xB5/dVE0Sq5sWZSvQ1e/OOBf3jdWTyHICN4pKgxkQyYuBqc7bIOFCZ8', 'super_admin');
