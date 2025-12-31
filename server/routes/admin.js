const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/supabase');
const { authenticateToken, generateToken } = require('../middleware/auth');

// Авторизация админа (временная для теста)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Временная проверка для теста
    if (username === 'admin' && password === 'admin') {
      const token = generateToken('admin', 'admin');
      return res.json({
        token,
        admin: {
          id: 1,
          username: 'admin',
          role: 'admin'
        }
      });
    }
    
    // Если база данных доступна, проверяем через нее
    try {
      const result = await pool.query(
        'SELECT * FROM admins WHERE username = $1',
        [username]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const admin = result.rows[0];
      const isValid = await bcrypt.compare(password, admin.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Обновляем время последнего входа
      await pool.query(
        'UPDATE admins SET last_login = NOW() WHERE id = $1',
        [admin.id]
      );
      
      const token = generateToken(admin.username, admin.role);
      res.json({
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          role: admin.role
        }
      });
    } catch (dbError) {
      // Если база недоступна, возвращаем ошибку
      return res.status(500).json({ error: 'Database error' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение статистики
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const ordersStats = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders
      FROM orders
    `);
    
    const usersCount = await pool.query(
      'SELECT COUNT(*) as count FROM users'
    );
    
    const productsCount = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE is_active = true'
    );
    
    const reviewsCount = await pool.query(
      'SELECT COUNT(*) as count FROM reviews WHERE is_approved = true'
    );
    
    res.json({
      orders: ordersStats.rows[0],
      users: usersCount.rows[0],
      products: productsCount.rows[0],
      reviews: reviewsCount.rows[0]
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение всех заказов
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await pool.query(`
      SELECT o.*, u.telegram_username, u.telegram_first_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    
    // Получаем товары для каждого заказа
    for (let order of orders.rows) {
      const items = await pool.query(`
        SELECT oi.*, p.name as product_name
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `, [order.id]);
      
      order.items = items.rows;
    }
    
    res.json(orders.rows);
  } catch (error) {
    console.error('Orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновление статуса заказа
router.put('/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
    
    res.json({ message: 'Order status updated' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение всех товаров (для админа)
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const products = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `);
    
    // Получение вкусов для каждого товара
    for (let product of products.rows) {
      const flavors = await pool.query(
        'SELECT * FROM product_flavors WHERE product_id = $1',
        [product.id]
      );
      product.flavors = flavors.rows;
    }
    
    res.json(products.rows);
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Создание товара
router.post('/products', authenticateToken, async (req, res) => {
  try {
    const { name, category_id, price, description, stock, flavors } = req.body;
    
    const product_id = `product-${Date.now()}`;
    
    await pool.query(`
      INSERT INTO products (id, name, category_id, price, description, stock)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [product_id, name, category_id, price, description, stock]);
    
    // Добавляем вкусы если есть
    if (flavors && flavors.length > 0) {
      for (let flavor of flavors) {
        await pool.query(
          'INSERT INTO product_flavors (product_id, flavor_name, stock) VALUES ($1, $2, $3)',
          [product_id, flavor.name, flavor.stock]
        );
      }
    }
    
    res.json({ id: product_id, message: 'Product created' });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновление товара
router.put('/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, price, description, stock, is_active } = req.body;
    
    await pool.query(`
      UPDATE products 
      SET name = $1, category_id = $2, price = $3, description = $4, stock = $5, is_active = $6, updated_at = NOW()
      WHERE id = $7
    `, [name, category_id, price, description, stock, is_active, id]);
    
    res.json({ message: 'Product updated' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение отзывов (для модерации)
router.get('/reviews', authenticateToken, async (req, res) => {
  try {
    const reviews = await pool.query(`
      SELECT r.*, p.name as product_name, u.telegram_username
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);
    res.json(reviews.rows);
  } catch (error) {
    console.error('Reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Модерация отзыва
router.put('/reviews/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;
    
    await pool.query(
      'UPDATE reviews SET is_approved = $1, updated_at = NOW() WHERE id = $2',
      [is_approved, id]
    );
    
    res.json({ message: 'Review moderation updated' });
  } catch (error) {
    console.error('Review moderation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Удаление отзыва
router.delete('/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
