const { Pool } = require('pg');
require('dotenv').config();

// Supabase PostgreSQL configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Отключаем SSL для теста
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to Supabase PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
