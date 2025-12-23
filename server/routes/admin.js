const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { authenticateToken, generateToken } = require('../middleware/auth');

// Авторизация админа
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [admin] = await pool.execute(
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
    await pool.execute(
      'UPDATE admins SET last_login = NOW() WHERE id = ?',
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

// Получение статистики
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [ordersStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders
      FROM orders
    `);
    
    const [usersCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM users'
    );
    
    const [productsCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM products WHERE is_active = true'
    );
    
    const [reviewsCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM reviews WHERE is_approved = true'
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
    const [orders] = await pool.execute(`
      SELECT o.*, u.telegram_username, u.telegram_first_name,
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'product_name', p.name,
                 'flavor_name', oi.flavor_name,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
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
    
    await pool.execute(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
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
    const [products] = await pool.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `);
    
    // Получение вкусов для каждого товара
    for (let product of products) {
      const [flavors] = await pool.execute(
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

// Создание товара
router.post('/products', authenticateToken, async (req, res) => {
  try {
    const { name, category_id, price, description, stock, flavors } = req.body;
    
    const [result] = await pool.execute(`
      INSERT INTO products (name, category_id, price, description, stock)
      VALUES (?, ?, ?, ?, ?)
    `, [name, category_id, price, description, stock]);
    
    const product_id = result.insertId;
    
    // Добавляем вкусы если есть
    if (flavors && flavors.length > 0) {
      for (let flavor of flavors) {
        await pool.execute(
          'INSERT INTO product_flavors (product_id, flavor_name, stock) VALUES (?, ?, ?)',
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
    
    await pool.execute(`
      UPDATE products 
      SET name = ?, category_id = ?, price = ?, description = ?, stock = ?, is_active = ?, updated_at = NOW()
      WHERE id = ?
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
    const [reviews] = await pool.execute(`
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
    
    await pool.execute(
      'UPDATE reviews SET is_approved = ?, updated_at = NOW() WHERE id = ?',
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
    
    await pool.execute('DELETE FROM reviews WHERE id = ?', [id]);
    
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
