const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set, using mock mode');
  // Mock pool for development without database
  pool = {
    query: async (text, params) => {
      console.log('Mock query:', text, params);
      return { rows: [] };
    },
    connect: async () => ({
      query: pool.query,
      release: () => {}
    })
  };
} else {
  // Neon PostgreSQL configuration
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Neon требует SSL
    max: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
  });

  // Test connection
  pool.on('connect', () => {
    console.log('Connected to Neon PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
}

module.exports = pool;
