import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { categories } from '../data/products';
import { useCart } from '../context/CartContext';
import ProductModal from '../components/ProductModal';
import VirtualizedProductGrid from '../components/VirtualizedProductGrid';
import { useOptimizedProducts, useFilteredProducts } from '../hooks/useOptimizedProducts';
import './HomePage.css';

const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFlavors, setSelectedFlavors] = useState({});
  const [flavorModalProductId, setFlavorModalProductId] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [modalProduct, setModalProduct] = useState(null);
  const [modalSelectedFlavor, setModalSelectedFlavor] = useState('');
  
  const { addToCartWithFlavor } = useCart();
  const { products, loading, error } = useOptimizedProducts();
  const filteredProducts = useFilteredProducts(products, selectedCategory);

  const handleAddToCart = useCallback((product) => {
    if (product.category === 'liquids' && product.flavors) {
      const selectedFlavor = selectedFlavors[product.id];
      if (!selectedFlavor) {
        alert('Пожалуйста, выберите вкус');
        return;
      }
      addToCartWithFlavor(product, selectedFlavor, 1);
    } else {
      addToCartWithFlavor(product, null, 1);
    }
  }, [selectedFlavors, addToCartWithFlavor]);

  const handleFlavorSelect = useCallback((productId, flavor) => {
    setSelectedFlavors(prev => ({
      ...prev,
      [productId]: flavor
    }));
    setFlavorModalProductId(null);
  }, []);

  const openFlavorModal = useCallback((productId) => {
    setFlavorModalProductId(productId);
  }, []);

  const closeFlavorModal = useCallback(() => {
    setFlavorModalProductId(null);
  }, []);

  const handleImageError = useCallback((productId) => {
    setImageErrors(prev => ({
      ...prev,
      [productId]: true
    }));
  }, []);

  const openModal = useCallback((product) => {
    setModalProduct(product);
    setModalSelectedFlavor('');
  }, []);

  const closeModal = useCallback(() => {
    setModalProduct(null);
    setModalSelectedFlavor('');
  }, []);

  const handleModalAddToCart = useCallback((product, flavor) => {
    if (product.category === 'liquids' && product.flavors && !flavor) {
      alert('Пожалуйста, выберите вкус');
      return;
    }
    addToCartWithFlavor(product, flavor, 1);
  }, [addToCartWithFlavor]);

  return (
    <div className="home-page">
      <div className="container">
        <div className="hero-section">
          <h1 className="page-title">PARADISE_SHOP</h1>
          <p className="page-subtitle">Лучший выбор vape продукции</p>
        </div>
        
        <div className="categories">
          <button 
            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Все товары
          </button>
          {categories.filter((c) => c.id === 'liquids').map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="products-section">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <div className="loading-text">Загрузка товаров...</div>
              <div className="skeleton-grid">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="skeleton-card">
                    <div className="skeleton-image"></div>
                    <div className="skeleton-content">
                      <div className="skeleton-title"></div>
                      <div className="skeleton-description"></div>
                      <div className="skeleton-price"></div>
                      <div className="skeleton-button"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products">
              <h3>Товары не найдены</h3>
              <p>Попробуйте выбрать другую категорию или вернитесь позже</p>
            </div>
          ) : (
            <VirtualizedProductGrid
              products={filteredProducts}
              selectedFlavor={selectedFlavors}
              onFlavorSelect={openFlavorModal}
              onAddToCart={handleAddToCart}
              onImageError={handleImageError}
              imageErrors={imageErrors}
            />
          )}
        </div>
      </div>
      
      <ProductModal
        product={modalProduct}
        isOpen={!!modalProduct}
        onClose={closeModal}
        onAddToCart={handleModalAddToCart}
        selectedFlavor={modalSelectedFlavor}
        setSelectedFlavor={setModalSelectedFlavor}
      />

      {flavorModalProductId !== null && (() => {
        const product = products.find((p) => p.id === flavorModalProductId);
        if (!product || !product.flavors) return null;
        return (
          <div className="flavor-modal-overlay" onClick={closeFlavorModal}>
            <div className="flavor-modal" onClick={(e) => e.stopPropagation()}>
              <div className="flavor-modal-header">
                <div className="flavor-modal-title">Выберите вкус</div>
                <button className="flavor-modal-close" onClick={closeFlavorModal} type="button">×</button>
              </div>
              <div className="flavor-modal-list">
                {Object.entries(product.flavors).map(([flavor, stock]) => (
                  <button
                    key={flavor}
                    type="button"
                    className={`flavor-modal-item ${stock === 0 ? 'out-of-stock' : ''}`}
                    onClick={() => {
                      if (stock > 0) handleFlavorSelect(product.id, flavor);
                    }}
                    disabled={stock === 0}
                  >
                    <span className="flavor-name">{flavor}</span>
                    <span className="flavor-stock">{stock > 0 ? `${stock} банок` : 'Нет в наличии'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default HomePage;
