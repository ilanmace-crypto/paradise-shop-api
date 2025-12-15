const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Кэш для API запросов
const apiCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 минуты кэширования

// Оптимизированная функция fetch с кэшированием
async function cachedFetch(url, options = {}) {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`API Cache hit: ${url}`);
    return cached.data;
  }

  console.log(`API Cache miss: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      // Добавляем таймаут
      signal: AbortSignal.timeout(10000), // 10 секунд таймаут
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Кэшируем успешный ответ
    apiCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    // При ошибке возвращаем устаревшие данные если они есть
    if (cached) {
      console.warn(`API failed, returning stale data for: ${url}`);
      return cached.data;
    }
    throw error;
  }
}

// Products API
export const getProducts = async () => {
  return cachedFetch(`${API_BASE_URL}/products`);
};

export const createProduct = async (product) => {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(product),
    signal: AbortSignal.timeout(10000),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create product');
  }
  
  const result = await response.json();
  
  // Очищаем кэш продуктов после создания
  apiCache.clear();
  
  return result;
};

// Update product image specifically
export const updateProductImage = async (id, imageBase64) => {
  console.log('Updating product image:', id);
  console.log('Image base64 length:', imageBase64.length);
  
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}/image`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageBase64 }),
    });
    
    console.log('Image update response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image update failed:', errorText);
      throw new Error(`Failed to update image: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Image update successful:', result);
    return result;
  } catch (error) {
    console.error('Image update error:', error);
    throw error;
  }
};

export const updateProduct = async (id, updates) => {
  console.log('Updating product:', id);
  console.log('Update data keys:', Object.keys(updates));
  console.log('Has image field:', 'image' in updates);
  if ('image' in updates) {
    console.log('Image length:', updates.image ? updates.image.length : 'undefined');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
      signal: AbortSignal.timeout(15000), // Больше времени для обновления с изображением
    });
    
    console.log('Update response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update failed response:', errorText);
      throw new Error(`Failed to update product: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Update successful, result keys:', Object.keys(result));
    
    // Очищаем кэш после обновления
    apiCache.clear();
    
    return result;
  } catch (error) {
    console.error('Update product error:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
    signal: AbortSignal.timeout(10000),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete product');
  }
  
  // Очищаем кэш после удаления
  apiCache.clear();
};

// Orders API
export const createOrder = async (order) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(order),
  });

  if (!response.ok) {
    throw new Error('Failed to create order');
  }

  return response.json();
};

// Categories API
export const getCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};

// Auth API - вход с логином и паролем
export const login = async (username, password) => {
  const cleanUsername = String(username || '').trim();
  const cleanPassword = String(password || '').trim();
  
  const payload = { 
    username: cleanUsername, 
    password: cleanPassword 
  };
  
  console.log('LOGIN REQUEST:', {
    username: cleanUsername,
    passwordLength: cleanPassword.length,
    firstChars: cleanPassword.substring(0, 3) + (cleanPassword.length > 3 ? '...' : '')
  });

  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Debug': 'true'
    },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Login failed:', response.status, errorData);
    throw new Error(errorData.error || 'Ошибка при входе');
  }
  
  return response.json();
};

// Health check
export const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error('Server unavailable');
  }
  return response.json();
};
