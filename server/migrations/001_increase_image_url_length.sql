-- Migration to increase image_url column length
ALTER TABLE products MODIFY COLUMN image_url VARCHAR(1000);
