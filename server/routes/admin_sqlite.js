const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/database');
const { generateToken } = require('../middleware/auth');

// Авторизация админа
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [admin] = await db.execute(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );
    
    if (admin.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, admin[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Обновляем время последнего входа
    await db.run(
      'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [admin[0].id]
    );
    
    const token = generateToken(admin[0].username, admin[0].role);
    res.json({
      token,
      admin: {
        id: admin[0].id,
        username: admin[0].username,
        role: admin[0].role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const authenticateToken = (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Получение статистики
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [ordersStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders
      FROM orders
    `);
    
    const [usersCount] = await db.execute(
      'SELECT COUNT(*) as count FROM users'
    );
    
    const [productsCount] = await db.execute(
      'SELECT COUNT(*) as count FROM products WHERE is_active = 1'
    );
    
    const [reviewsCount] = await db.execute(
      'SELECT COUNT(*) as count FROM reviews WHERE is_approved = 1'
    );
    
    res.json({
      orders: ordersStats[0],
      users: usersCount[0],
      products: productsCount[0],
      reviews: reviewsCount[0]
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение всех заказов
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const [orders] = await db.execute(`
      SELECT o.*, u.telegram_username, u.telegram_first_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    
    res.json(orders);
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
    
    await db.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
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
    const [products] = await db.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `);
    
    // Получение вкусов для каждого товара
    for (let product of products) {
      const [flavors] = await db.execute(
        'SELECT * FROM product_flavors WHERE product_id = ?',
        [product.id]
      );
      product.flavors = flavors;
    }
    
    res.json(products);
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение отзывов (для модерации)
router.get('/reviews', authenticateToken, async (req, res) => {
  try {
    const [reviews] = await db.execute(`
      SELECT r.*, p.name as product_name, u.telegram_username
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);
    res.json(reviews);
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
    
    await db.run(
      'UPDATE reviews SET is_approved = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
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
    
    await db.run('DELETE FROM reviews WHERE id = ?', [id]);
    
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
