const express = require('express');
const router = express.Router();
const pool = require('../config/supabase');

// GET /api/users - получить всех пользователей
router.get('/', async (req, res) => {
  try {
    const users = await pool.query(`
      SELECT u.*, 
             COUNT(o.id) as orders_count,
             COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    
    res.json(users.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users - создать нового пользователя (Telegram)
router.post('/', async (req, res) => {
  try {
    const { telegram_id, telegram_username, telegram_first_name, telegram_last_name, phone } = req.body;
    
    if (!telegram_id) {
      return res.status(400).json({ error: 'Telegram ID is required' });
    }
    
    // Проверяем, существует ли пользователь
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegram_id]
    );
    
    if (existingUser.rows.length > 0) {
      // Обновляем существующего пользователя
      const updatedUser = await pool.query(`
        UPDATE users 
        SET telegram_username = $1, telegram_first_name = $2, telegram_last_name = $3, phone = $4, updated_at = NOW()
        WHERE telegram_id = $5
        RETURNING *
      `, [telegram_username, telegram_first_name, telegram_last_name, phone, telegram_id]);
      
      return res.json(updatedUser.rows[0]);
    }
    
    // Создаем нового пользователя
    const newUser = await pool.query(`
      INSERT INTO users (telegram_id, telegram_username, telegram_first_name, telegram_last_name, phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [telegram_id, telegram_username, telegram_first_name, telegram_last_name, phone]);
    
    res.status(201).json(newUser.rows[0]);
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ error: 'Failed to create/update user' });
  }
});

// GET /api/users/:id - получить пользователя по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await pool.query(`
      SELECT u.*, 
             COUNT(o.id) as orders_count,
             COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [id]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/users/telegram/:telegram_id - найти пользователя по Telegram ID
router.get('/telegram/:telegram_id', async (req, res) => {
  try {
    const { telegram_id } = req.params;
    
    const user = await pool.query(`
      SELECT u.*, 
             COUNT(o.id) as orders_count,
             COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.telegram_id = $1
      GROUP BY u.id
    `, [telegram_id]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user.rows[0]);
  } catch (error) {
    console.error('Error fetching user by Telegram ID:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
