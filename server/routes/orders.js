const express = require('express');
const router = express.Router();
const pool = require('../config/supabase');

// GET /api/orders - получить все заказы
router.get('/', async (req, res) => {
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
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /api/orders - создать новый заказ
router.post('/', async (req, res) => {
  try {
    const { user_id, total_amount, delivery_address, phone, notes, items } = req.body;
    
    if (!user_id || !total_amount || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Создаем заказ
      const orderResult = await client.query(`
        INSERT INTO orders (user_id, total_amount, delivery_address, phone, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [user_id, total_amount, delivery_address, phone, notes]);
      
      const order = orderResult.rows[0];
      
      // Добавляем товары заказа
      for (let item of items) {
        await client.query(`
          INSERT INTO order_items (order_id, product_id, flavor_name, quantity, price)
          VALUES ($1, $2, $3, $4, $5)
        `, [order.id, item.product_id, item.flavor_name, item.quantity, item.price]);
      }
      
      await client.query('COMMIT');
      res.status(201).json(order);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT /api/orders/:id/status - обновить статус заказа
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
