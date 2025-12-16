import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Получаем все товары из KV
      const products = await kv.get('products') || [];
      res.status(200).json(products);
    } else if (req.method === 'POST') {
      // Добавляем новый товар в KV
      const newProduct = {
        ...req.body,
        id: Date.now(),
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      
      const products = await kv.get('products') || [];
      products.push(newProduct);
      await kv.set('products', products);
      
      res.status(201).json(newProduct);
    } else if (req.method === 'PUT') {
      // Обновляем товар в KV
      const { id } = req.query;
      const products = await kv.get('products') || [];
      const index = products.findIndex(p => p.id == id);
      
      if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      products[index] = { ...products[index], ...req.body };
      await kv.set('products', products);
      
      res.status(200).json(products[index]);
    } else if (req.method === 'DELETE') {
      // Удаляем товар из KV
      const { id } = req.query;
      const products = await kv.get('products') || [];
      const filteredProducts = products.filter(p => p.id != id);
      
      await kv.set('products', filteredProducts);
      res.status(204).end();
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
