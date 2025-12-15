import React, { memo, useState, useCallback } from 'react';

const ProductCard = memo(({ 
  product, 
  selectedFlavor, 
  onFlavorSelect, 
  onAddToCart, 
  onImageError,
  imageError 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    onImageError(product.id);
  }, [product.id, onImageError]);

  const getPlaceholderImage = () => {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDMwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjQwIiBmaWxsPSJ1cmwoI2dyYWRpZW50MCkiLz4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQwIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I0Y4RjlGQTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRTlFQ0VGO3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+CjxwYXRoIGQ9Ik0xMjAgNzBIMTgwVjkwSDEyMFYxMTBIMTgwVjEzMEgxMjBWMTUwSDE4MFYxNzBIMTIwVjE5MEgxODBWNzBaIiBmaWxsPSIjREVERUQ2IiBmaWxsLW9wYWNpdHk9IjAuNiIvPgo8Y2lyY2xlIGN4PSIxNTAiIGN5PSI5NSIgcj0iOCIgZmlsbD0iI0RERERENiIgZmlsbC1vcGFjaXR5PSIwLjgiLz4KPHJlY3QgeD0iMTQwIiB5PSIxMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI0MCIgZmlsbD0iI0RERERENiIgZmlsbC1vcGFjaXR5PSIwLjgiLz4KPHRleHQgeD0iMTUwIiB5PSIxODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9IjUwMCI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=';
  };

  return (
    <div className="product-card">
      <div className="product-image">
        {imageLoading && !imageLoaded && (
          <div className="image-skeleton">
            <div className="skeleton-loader"></div>
          </div>
        )}
        <img 
          src={imageError ? getPlaceholderImage() : product.image}
          alt={product.name}
          className={`product-img ${imageLoaded ? 'loaded' : 'loading'} ${imageError ? 'error' : ''}`}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: imageLoading && !imageLoaded ? 'none' : 'block' }}
        />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>

        {product.category !== 'liquids' && typeof product.stock === 'number' && (
          <div className={`stock-badge ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
            {product.stock > 0 ? `В наличии: ${product.stock} шт.` : 'Нет в наличии'}
          </div>
        )}
        
        {product.category === 'liquids' && product.flavors && Object.keys(product.flavors).length > 0 && (
          <div className="flavor-selector">
            <label>Выберите вкус:</label>
            <button
              type="button"
              className="flavor-dropdown-btn"
              onClick={() => onFlavorSelect(product.id)}
            >
              {selectedFlavor || 'Выберите вкус'} ↓
            </button>
          </div>
        )}
        
        <div className="product-footer">
          <span className="product-price">{product.price} BYN</span>
          <button 
            onClick={() => onAddToCart(product)} 
            className="add-to-cart-btn"
          >
            В корзину
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
