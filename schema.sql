-- PARADISE SHOP - Full Schema for Neon PostgreSQL
-- Run this in Neon SQL Editor to create all tables

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
  ('liquids', 'liquids', 'Vape liquids/e-liquids'),
  ('consumables', 'consumables', 'Vape consumables/coils, pods, etc.')
ON CONFLICT (slug) DO NOTHING;

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id INTEGER NOT NULL REFERENCES categories(id),
  image_url VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product Flavors (for liquids)
CREATE TABLE IF NOT EXISTS product_flavors (
  id SERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  flavor_name VARCHAR(100) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, flavor_name)
);

-- Product Images (stored as base64)
CREATE TABLE IF NOT EXISTS product_images (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  mime_type TEXT NOT NULL CHECK (mime_type ~ '^image/(jpeg|png|webp|gif)$'),
  data TEXT NOT NULL CHECK (length(data) <= 2097152), -- 2MB max
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE,
  telegram_username VARCHAR(100),
  telegram_first_name VARCHAR(100),
  telegram_last_name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  telegram_id BIGINT,
  telegram_username VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  customer_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  flavor_name VARCHAR(100),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  telegram_username VARCHAR(100),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_flavors_product ON product_flavors(product_id);
CREATE INDEX IF NOT EXISTS idx_product_flavors_name ON product_flavors(flavor_name);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_telegram ON orders(telegram_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_active ON reviews(is_active);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_flavors_updated_at BEFORE UPDATE ON product_flavors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update product stock when flavors change
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        UPDATE products 
        SET stock = (
            SELECT COALESCE(SUM(stock), 0) 
            FROM product_flavors 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        ),
        is_active = CASE 
            WHEN (
                SELECT COALESCE(SUM(stock), 0) 
                FROM product_flavors 
                WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
            ) > 0 THEN true 
            ELSE false 
        END
        WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    END IF;
    
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to product_flavors
CREATE TRIGGER sync_product_stock 
    AFTER INSERT OR UPDATE OR DELETE ON product_flavors 
    FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- Sample data (optional)
INSERT INTO products (name, description, price, stock, category_id) VALUES
  ('PARADISE Liquid 30ml', 'Premium vape liquid with various flavors', 25.00, 0, 1),
  ('VMATE B3 0.7ohm Pods', 'High-quality pods for VMATE devices', 15.00, 10, 2)
ON CONFLICT DO NOTHING;

-- Sample flavors
INSERT INTO product_flavors (product_id, flavor_name, stock) 
SELECT p.id, 'Mango Ice', 5 FROM products p WHERE p.name = 'PARADISE Liquid 30ml'
ON CONFLICT (product_id, flavor_name) DO NOTHING;

INSERT INTO product_flavors (product_id, flavor_name, stock) 
SELECT p.id, 'Blueberry', 3 FROM products p WHERE p.name = 'PARADISE Liquid 30ml'
ON CONFLICT (product_id, flavor_name) DO NOTHING;

-- Sample review
INSERT INTO reviews (product_id, rating, comment, telegram_username) 
SELECT p.id, 5, 'Excellent liquid, great flavor!', 'happy_customer' 
FROM products p WHERE p.name = 'PARADISE Liquid 30ml'
ON CONFLICT DO NOTHING;
