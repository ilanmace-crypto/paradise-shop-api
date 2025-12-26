const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Используем PostgreSQL если DATABASE_URL задан
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
const apiRoutes = process.env.DATABASE_URL ? 
  require('./routes/api_postgresql') : 
  null;
const adminRoutes = process.env.DATABASE_URL ? 
  require('./routes/admin_postgresql') : 
  null;

const initDatabase = process.env.DATABASE_URL ? 
  require('./config/postgresql_init').initPostgresDatabase : 
  null;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
console.log('API Routes:', apiRoutes ? 'LOADED' : 'NOT LOADED');
console.log('Admin Routes:', adminRoutes ? 'LOADED' : 'NOT LOADED');
if (apiRoutes) app.use('/api', apiRoutes);
if (adminRoutes) app.use('/admin', adminRoutes);

// Health check (before rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  
  // Initialize database
  try {
    if (initDatabase) {
      await initDatabase();
      console.log('Database initialized successfully!');
    } else {
      console.log('No database configured - running without database');
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Don't exit, let server start anyway
  }
});
