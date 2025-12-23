// Railway MySQL Setup Script
console.log(`
=== RAILWAY MYSQL SETUP ===

1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click "New Project" → "Provision MySQL"
4. Wait for database to be ready
5. Click on MySQL database → "Connect" → "MySQL Connection String"
6. Copy connection string (looks like: mysql://user:password@host:port/database)

7. Update your .env file:
DB_HOST=your-host.railway.app
DB_PORT=port_from_connection
DB_USER=username_from_connection
DB_PASSWORD=password_from_connection
DB_NAME=database_name_from_connection

8. Run this to create tables:
node setup_mysql_tables.js

9. Start server:
node server.js

=== ALTERNATIVE: PLANETSCALE (FREE) ===
1. Go to https://planetscale.com
2. Create database "paradise_shop"
3. Create branch "main"
4. Get connection string
5. Update .env and run setup_mysql_tables.js
EOF);
