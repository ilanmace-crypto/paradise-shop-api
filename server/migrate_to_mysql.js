const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Путь к SQLite базе
const dbPath = path.join(__dirname, '../data/paradise_shop.db');
const db = new sqlite3.Database(dbPath);

// Создаем SQL файл для импорта в MySQL
const sqlFile = path.join(__dirname, 'mysql_migration.sql');
const writeStream = fs.createWriteStream(sqlFile);

writeStream.write('-- Migration SQL for MySQL\n');
writeStream.write('-- Generated from SQLite database\n\n');

// Экспорт категорий
db.all("SELECT * FROM categories", (err, rows) => {
  if (err) throw err;
  
  writeStream.write('-- Categories\n');
  writeStream.write('INSERT INTO categories (id, name, slug, description, created_at) VALUES\n');
  
  rows.forEach((row, index) => {
    const values = `(${row.id}, '${row.name}', '${row.slug}', '${row.description || ''}', '${row.created_at}')`;
    writeStream.write(values + (index === rows.length - 1 ? ';\n\n' : ',\n'));
  });
  
  // Экспорт товаров
  db.all("SELECT * FROM products", (err, rows) => {
    if (err) throw err;
    
    writeStream.write('-- Products\n');
    writeStream.write('INSERT INTO products (id, name, category_id, price, description, image_url, stock, is_active, created_at, updated_at) VALUES\n');
    
    rows.forEach((row, index) => {
      const values = `('${row.id}', '${row.name}', ${row.category_id || 'NULL'}, ${row.price}, '${row.description || ''}', '${row.image_url || ''}', ${row.stock}, ${row.is_active}, '${row.created_at}', '${row.updated_at}')`;
      writeStream.write(values + (index === rows.length - 1 ? ';\n\n' : ',\n'));
    });
    
    // Экспорт вкусов
    db.all("SELECT * FROM product_flavors", (err, rows) => {
      if (err) throw err;
      
      writeStream.write('-- Product Flavors\n');
      writeStream.write('INSERT INTO product_flavors (id, product_id, flavor_name, stock, created_at) VALUES\n');
      
      rows.forEach((row, index) => {
        const values = `(${row.id}, '${row.product_id}', '${row.flavor_name}', ${row.stock}, '${row.created_at}')`;
        writeStream.write(values + (index === rows.length - 1 ? ';\n\n' : ',\n'));
      });
      
      // Экспорт админа
      db.all("SELECT * FROM admins", (err, rows) => {
        if (err) throw err;
        
        writeStream.write('-- Admin\n');
        rows.forEach(row => {
          writeStream.write(`INSERT INTO admins (id, username, password_hash, role, created_at, last_login) VALUES (${row.id}, '${row.username}', '${row.password_hash}', '${row.role}', '${row.created_at}', ${row.last_login ? `'${row.last_login}'` : 'NULL'});\n\n`);
        });
        
        writeStream.end();
        console.log('Migration SQL file created:', sqlFile);
        
        db.close();
      });
    });
  });
});
