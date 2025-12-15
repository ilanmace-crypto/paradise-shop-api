// Агрессивное кэширование для максимальной производительности

class DataCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 минут
    this.longTTL = 30 * 60 * 1000; // 30 минут для статичных данных
  }

  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now() + ttl);
  }

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() > timestamp) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  // Предзагрузка данных
  async preload(keys, fetchFn) {
    const promises = keys.map(async (key) => {
      if (!this.has(key)) {
        try {
          const data = await fetchFn(key);
          this.set(key, data);
          return data;
        } catch (error) {
          console.warn(`Failed to preload ${key}:`, error);
          return null;
        }
      }
      return this.get(key);
    });
    
    return Promise.all(promises);
  }
}

// Кэш для изображений
class ImageCache {
  constructor() {
    this.cache = new Map();
    this.loading = new Map();
    this.maxSize = 50; // Максимум 50 изображений в кэше
  }

  async get(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    if (this.loading.has(url)) {
      return this.loading.get(url);
    }

    const promise = this.loadImage(url);
    this.loading.set(url, promise);
    
    try {
      const result = await promise;
      this.cache.set(url, result);
      this.loading.delete(url);
      
      // Очищаем кэш если превысили лимит
      if (this.cache.size > this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      return result;
    } catch (error) {
      this.loading.delete(url);
      throw error;
    }
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = reject;
      img.src = url;
    });
  }
}

export const dataCache = new DataCache();
export const imageCache = new ImageCache();

// Оптимизированная функция для API запросов с кэшированием
export function withCache(fetchFn, key, ttl) {
  return async (...args) => {
    const cacheKey = typeof key === 'function' ? key(...args) : key;
    
    // Проверяем кэш
    const cached = dataCache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    console.log(`Cache miss for ${cacheKey}, fetching...`);
    
    try {
      const data = await fetchFn(...args);
      dataCache.set(cacheKey, data, ttl);
      return data;
    } catch (error) {
      // Если есть устаревшие данные в кэше, возвращаем их при ошибке
      const staleData = dataCache.cache.get(cacheKey);
      if (staleData) {
        console.warn(`API failed for ${cacheKey}, returning stale data`);
        return staleData;
      }
      throw error;
    }
  };
}
