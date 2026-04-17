import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

const AdminPanel = ({ onLogout }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const normalizeProduct = (p) => {
    const category = Number(p?.category_id) === 1
      ? 'liquids'
      : (Number(p?.category_id) === 2 ? 'consumables' : (p?.category || null));

    const flavors = Array.isArray(p?.flavors)
      ? p.flavors
        .map((f) => {
          if (typeof f === 'string') {
            return { flavor_name: f, stock: 0 };
          }
          return {
            flavor_name: f?.flavor_name || f?.name || '',
            stock: Number(f?.stock ?? 0),
          };
        })
        .filter((f) => f.flavor_name)
      : [];

    return {
      ...p,
      category,
      flavors,
    };
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token');

      const productsResponse = await fetch('/api/admin/products', {
        headers: { 'Authorization': `Basic ${token}` }
      });
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        const normalizedProducts = Array.isArray(productsData) ? productsData.map(normalizeProduct) : [];
        setProducts(normalizedProducts);
      } else if (productsResponse.status === 401) {
        localStorage.removeItem('adminToken');
        onLogout();
        return;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (product) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token');
      
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${token}`
        },
        body: JSON.stringify(product),
      });
      
      if (response.ok) {
        await loadData();
        setShowAddProduct(false);
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        onLogout();
      } else {
        const errBody = await response.json().catch(() => null);
        throw new Error(errBody?.error || 'Failed to add product');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleUpdateProduct = async (product) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token');
      
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${token}`
        },
        body: JSON.stringify(product),
      });
      
      if (response.ok) {
        await loadData();
        setEditingProduct(null);
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        onLogout();
      } else {
        const errBody = await response.json().catch(() => null);
        throw new Error(errBody?.error || 'Failed to update product');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token');
      
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Basic ${token}` }
      });
      
      if (response.ok) {
        setProducts(products.filter(p => p.id !== id));
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        onLogout();
      } else {
        const errBody = await response.json().catch(() => null);
        throw new Error(errBody?.error || 'Failed to delete product');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Админ-панель</h2>
        <div className="admin-actions">
          <button className="btn-add" onClick={() => setShowAddProduct(true)}>Добавить товар</button>
          <button className="btn-logout" onClick={onLogout}>Выход</button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-products">
        {products.map((p) => (
          <div key={p.id} className="admin-product-card">
            {p.image_url && <img src={p.image_url} alt={p.name} className="admin-product-img" />}
            <div className="admin-product-info">
              <h3>{p.name}</h3>
              <p>{p.price} BYN | {p.category === 'liquids' ? 'Жидкость' : 'Расходник'}</p>
              <p>Остаток: {p.stock}</p>
            </div>
            <div className="admin-product-btns">
              <button onClick={() => setEditingProduct(p)}>Редактировать</button>
              <button className="btn-delete" onClick={() => handleDeleteProduct(p.id)}>Удалить</button>
            </div>
          </div>
        ))}
      </div>

      {/* Модалки добавления/редактирования (упрощено для примера) */}
      {(showAddProduct || editingProduct) && (
        <div className="admin-modal">
           {/* Тут должна быть форма FormModal, которую ты уже использовал */}
           <button onClick={() => { setShowAddProduct(false); setEditingProduct(null); }}>Закрыть</button>
           <p>Форма редактирования/добавления (используй существующий компонент FormModal)</p>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
