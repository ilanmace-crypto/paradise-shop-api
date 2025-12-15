import { useState, useEffect, useMemo, useCallback } from 'react';
import { getProducts } from '../data/products';

// Оптимизированный хук для загрузки товаров с кэшированием
export const useOptimizedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const startTime = performance.now();
        const data = await getProducts();
        const endTime = performance.now();
        
        if (isMounted) {
          console.log(`Products loaded in ${endTime - startTime}ms`);
          setProducts(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load products:', err);
          setError('Не удалось загрузить товары. Попробуйте обновить страницу.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return { products, loading, error };
};

// Оптимизированный хук для фильтрации с useMemo
export const useFilteredProducts = (products, selectedCategory) => {
  return useMemo(() => {
    if (!products.length) return [];

    const filterFn = (product) => {
      // Скрываем жидкости, у которых закончились все вкусы
      if (product.category === 'liquids') {
        const flavors = product.flavors ? Object.entries(product.flavors) : [];
        if (flavors.length === 0) return false;
        const hasStock = flavors.some(([, stock]) => stock > 0);
        return hasStock;
      }
      return true;
    };

    return selectedCategory === 'all' 
      ? products.filter(filterFn)
      : products.filter(product => {
          const categoryMatch = product.category === selectedCategory;
          if (!categoryMatch) return false;
          return filterFn(product);
        });
  }, [products, selectedCategory]);
};
