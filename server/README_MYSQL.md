# MySQL Setup Instructions

## Option 1: Docker (Recommended)

1. Install Docker Desktop from https://docker.com
2. Run: `docker-compose up -d`
3. MySQL will be available on localhost:3307

## Option 2: Local MySQL

1. Install MySQL/MariaDB
2. Run: `mysql -u root -p`
3. Execute: `CREATE DATABASE paradise_shop;`
4. Create user: `CREATE USER 'paradise_user'@'localhost' IDENTIFIED BY 'PARADISE251208';`
5. Grant privileges: `GRANT ALL PRIVILEGES ON paradise_shop.* TO 'paradise_user'@'localhost';`
6. Import schema: `mysql -u paradise_user -pPARADISE251208 paradise_shop < database.sql`

## Update .env

```
DB_HOST=localhost
DB_PORT=3307 (for Docker) or 3306 (for local)
DB_USER=paradise_user
DB_PASSWORD=PARADISE251208
DB_NAME=paradise_shop
```

## Switch to MySQL

1. Stop current server: `pkill -f "node server.js"`
2. Update server.js to use MySQL routes instead of SQLite
3. Start server: `node server.js`
