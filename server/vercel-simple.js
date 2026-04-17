const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Neon Postgres pool
const pool = require('./config/neon');

const app = express();
const projectRoot = path.join(__dirname, '..');

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Serve static files
app.use('/assets', express.static(path.join(projectRoot, 'client/dist/assets'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  },
}));

app.use(express.static(projectRoot, { index: false }));

// CSP headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline' blob:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss: blob:; worker-src 'self' blob:; media-src 'self' blob:; manifest-src 'self';"
  );
  next();
});

// Helper: render index.html dynamically
const renderIndexHtml = (res) => {
  try {
    const assetsDir = path.join(projectRoot, 'client/dist/assets');
    const files = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];

    const pickLatestByMtime = (candidates) => {
      let best = null;
      let bestMtime = -1;
      for (const f of candidates) {
        try {
          const stat = fs.statSync(path.join(assetsDir, f));
          const m = Number(stat.mtimeMs || 0);
          if (m > bestMtime) {
            bestMtime = m;
            best = f;
          }
        } catch {
          // ignore
        }
      }
      return best;
    };

    const jsCandidates = files.filter((f) => /^index-.*\.js$/.test(f));
    const cssCandidates = files.filter((f) => /^index-.*\.css$/.test(f));

    const jsFile = pickLatestByMtime(jsCandidates);
    const cssFile = pickLatestByMtime(cssCandidates);

    if (!jsFile || !cssFile) {
      res.setHeader('Cache-Control', 'no-store');
      return res.sendFile(path.join(projectRoot, 'client/dist/index.html'));
    }

    const v = Date.now();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>PARADISE-SHOP</title>
    <script type="module" crossorigin src="/assets/${jsFile}?v=${v}"></script>
    <link rel="stylesheet" crossorigin href="/assets/${cssFile}?v=${v}">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
    );
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');
    return res.sendFile(path.join(projectRoot, 'client/dist/index.html'));
  }
};

// API Routes

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Debug working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    vercel: {
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      gitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'unknown',
      gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF || 'unknown',
      gitRepoSlug: process.env.VERCEL_GIT_REPO_SLUG || 'unknown',
      gitRepoOwner: process.env.VERCEL_GIT_REPO_OWNER || 'unknown',
      region: process.env.VERCEL_REGION || 'unknown',
      url: process.env.VERCEL_URL || 'unknown',
    },
    runtime: {
      node: process.version,
      pid: process.pid,
      cwd: process.cwd(),
    },
    db: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlSet: !!process.env.DATABASE_URL,
    }
  });
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pf.id,
              'flavor_name', pf.flavor_name,
              'stock', pf.stock
            )
          ) FILTER (WHERE pf.id IS NOT NULL), 
          '[]'::json
        ) as flavors
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_flavors pf ON p.id = pf.product_id
      WHERE p.is_active = true
      GROUP BY p.id, c.name, c.slug
      ORDER BY p.created_at DESC
    `);

    // Add image_url from product_images if exists
    for (const product of result.rows) {
      const imgRes = await pool.query('SELECT mime_type, data FROM product_images WHERE product_id = $1', [product.id]);
      if (imgRes.rows.length > 0) {
        const row = imgRes.rows[0];
        product.image_url = `data:${row.mime_type};base64,${row.data}`;
      }
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
app.get('/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pf.id,
              'flavor_name', pf.flavor_name,
              'stock', pf.stock
            )
          ) FILTER (WHERE pf.id IS NOT NULL), 
          '[]'::json
        ) as flavors
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_flavors pf ON p.id = pf.product_id
      WHERE p.is_active = true
      GROUP BY p.id, c.name, c.slug
      ORDER BY p.created_at DESC
    `);

    // Add image_url from product_images if exists
    for (const product of result.rows) {
      const imgRes = await pool.query('SELECT mime_type, data FROM product_images WHERE product_id = $1', [product.id]);
      if (imgRes.rows.length > 0) {
        const row = imgRes.rows[0];
        product.image_url = `data:${row.mime_type};base64,${row.data}`;
      }
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get reviews for a product
app.get('/api/reviews/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await pool.query(`
      SELECT r.*, u.telegram_username
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1 AND r.is_active = true
      ORDER BY r.created_at DESC
    `, [productId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create order
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    const { telegram_user, items } = req.body;
    
    await client.query('BEGIN');

    // Resolve or create user
    let userId = null;
    if (telegram_user?.telegram_id) {
      const userRes = await client.query(
        'SELECT id FROM users WHERE telegram_id = $1',
        [telegram_user.telegram_id]
      );
      
      if (userRes.rows.length > 0) {
        userId = userRes.rows[0].id;
      } else {
        const newUser = await client.query(
          `INSERT INTO users (telegram_id, telegram_username, telegram_first_name, telegram_last_name) 
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [
            telegram_user.telegram_id,
            telegram_user.username || null,
            telegram_user.first_name || null,
            telegram_user.last_name || null
          ]
        );
        userId = newUser.rows[0].id;
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, telegram_id, telegram_username, status, total_amount, customer_name, customer_phone, customer_address, notes) 
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $8) RETURNING *`,
      [
        userId,
        telegram_user?.telegram_id || null,
        telegram_user?.username || null,
        totalAmount,
        req.body.customer_name || null,
        req.body.customer_phone || null,
        req.body.customer_address || null,
        req.body.notes || null
      ]
    );
    
    const orderId = orderRes.rows[0].id;

    // Add order items and update stock
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, flavor_name, quantity, price) 
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.product_id, item.flavor || null, item.quantity, item.price]
      );

      // Update stock
      if (item.flavor) {
        const stockCheck = await client.query(
          'SELECT stock FROM product_flavors WHERE product_id = $1 AND flavor_name = $2',
          [item.product_id, item.flavor]
        );
        if (stockCheck.rows.length === 0 || Number(stockCheck.rows[0].stock) < item.quantity) {
          throw new Error(`No stock for flavor: ${item.flavor} (available: ${stockCheck.rows[0]?.stock ?? 0})`);
        }

        await client.query(
          'UPDATE product_flavors SET stock = stock - $1 WHERE product_id = $2 AND flavor_name = $3',
          [item.quantity, item.product_id, item.flavor]
        );

        // Update product total stock
        const sumRes = await client.query(
          'SELECT COALESCE(SUM(stock), 0) AS total FROM product_flavors WHERE product_id = $1',
          [item.product_id]
        );
        const total = Number(sumRes.rows?.[0]?.total || 0);
        await client.query(
          'UPDATE products SET stock = $1, is_active = CASE WHEN $1 <= 0 THEN false ELSE is_active END WHERE id = $2',
          [total, item.product_id]
        );
      } else {
        const stockCheck = await client.query(
          'SELECT stock FROM products WHERE id = $1',
          [item.product_id]
        );
        if (stockCheck.rows.length === 0 || Number(stockCheck.rows[0].stock) < item.quantity) {
          throw new Error(`No stock for product: ${item.product_id} (available: ${stockCheck.rows[0]?.stock ?? 0})`);
        }

        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, order_id: orderId });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Admin routes
const adminAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== 'Basic ' + Buffer.from('admin:paradise251208').toString('base64')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Get all products (admin)
app.get('/admin/products', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pf.id,
              'flavor_name', pf.flavor_name,
              'stock', pf.stock
            )
          ) FILTER (WHERE pf.id IS NOT NULL), 
          '[]'::json
        ) as flavors
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_flavors pf ON p.id = pf.product_id
      GROUP BY p.id, c.name, c.slug
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create product (admin)
app.post('/admin/products', adminAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { name, description, price, category, stock, flavors, image_url } = req.body;
    
    // Get category ID
    const catRes = await client.query('SELECT id FROM categories WHERE slug = $1', [category]);
    if (catRes.rows.length === 0) {
      throw new Error('Invalid category');
    }
    const categoryId = catRes.rows[0].id;

    // Create product
    const productRes = await client.query(
      `INSERT INTO products (name, description, price, stock, category_id, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, Number(price), Number(stock) || 0, categoryId, image_url || null]
    );
    
    const productId = productRes.rows[0].id;

    // Handle image if it's a data URL
    if (image_url && image_url.startsWith('data:')) {
      const match = image_url.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const b64 = match[2];
        
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime)) {
          throw new Error('Invalid image format');
        }
        
        if (b64.length > 2097152) { // 2MB
          throw new Error('Image too large');
        }

        await client.query(
          'INSERT INTO product_images (product_id, mime_type, data) VALUES ($1, $2, $3)',
          [productId, mime, b64]
        );
      }
    }

    // Add flavors if it's a liquid
    if (category === 'liquids' && Array.isArray(flavors)) {
      for (const flavor of flavors) {
        if (flavor.name && flavor.stock > 0) {
          await client.query(
            'INSERT INTO product_flavors (product_id, flavor_name, stock) VALUES ($1, $2, $3)',
            [productId, flavor.name, Number(flavor.stock)]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, product: productRes.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Product creation error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Update product (admin)
app.put('/admin/products/:id', adminAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { name, description, price, category, stock, flavors, image_url } = req.body;
    
    // Get category ID
    const catRes = await client.query('SELECT id FROM categories WHERE slug = $1', [category]);
    if (catRes.rows.length === 0) {
      throw new Error('Invalid category');
    }
    const categoryId = catRes.rows[0].id;

    // Update product
    const productRes = await client.query(
      `UPDATE products SET name = $1, description = $2, price = $3, stock = $4, category_id = $5, image_url = $6, updated_at = NOW() 
       WHERE id = $7 RETURNING *`,
      [name, description, Number(price), Number(stock) || 0, categoryId, image_url || null, id]
    );
    
    if (productRes.rows.length === 0) {
      throw new Error('Product not found');
    }

    // Handle image if it's a data URL
    if (image_url && image_url.startsWith('data:')) {
      const match = image_url.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const b64 = match[2];
        
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime)) {
          throw new Error('Invalid image format');
        }
        
        if (b64.length > 2097152) { // 2MB
          throw new Error('Image too large');
        }

        await client.query(
          'INSERT INTO product_images (product_id, mime_type, data) VALUES ($1, $2, $3) ON CONFLICT (product_id) DO UPDATE SET mime_type = $2, data = $3, updated_at = NOW()',
          [id, mime, b64]
        );
      }
    }

    // Update flavors
    await client.query('DELETE FROM product_flavors WHERE product_id = $1', [id]);
    
    if (category === 'liquids' && Array.isArray(flavors)) {
      for (const flavor of flavors) {
        if (flavor.name && flavor.stock > 0) {
          await client.query(
            'INSERT INTO product_flavors (product_id, flavor_name, stock) VALUES ($1, $2, $3)',
            [id, flavor.name, Number(flavor.stock)]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, product: productRes.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Product update error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Delete product (admin)
app.delete('/admin/products/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Vite.svg
app.get('/vite.svg', (req, res) => {
  res.sendFile(path.join(projectRoot, 'client/dist/vite.svg'));
});

// SPA fallback - must be last
app.use((req, res) => {
  renderIndexHtml(res);
});

// Export for Vercel
module.exports = (req, res) => {
  app(req, res);
};
