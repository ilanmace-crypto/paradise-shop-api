import { getProducts as fetchProducts, createProduct as addProduct, updateProduct as modifyProduct, deleteProduct as removeProduct } from '../services/apiService';

export const categories = [
  { id: 'liquids', name: 'Жидкости', description: 'Жидкости для вейпинга' },
  { id: 'cartridges', name: 'Картриджи', description: 'Сменные картриджи' },
  { id: 'disposable', name: 'Одноразовые', description: 'Одноразовые вейпы' }
];

// Загрузка всех товаров из API
export const getProducts = async () => {
  try {
    const data = await fetchProducts();
    return data.map(product => {
      // Map backend category_name to frontend category id
      const matchedCategory = categories.find(
        (cat) => cat.name === product.category_name
      );

      let flavorsParsed = {};
      try {
        flavorsParsed = product.flavors ? JSON.parse(product.flavors) : {};
      } catch (_) {
        // If already object, keep as is
        flavorsParsed = typeof product.flavors === 'object' && product.flavors !== null
          ? product.flavors
          : {};
      }

      // Если категория не проставлена на бэке, но есть вкусы,
      // считаем товар жидкостью, чтобы работал выбор вкуса.
      const hasFlavors = flavorsParsed && Object.keys(flavorsParsed).length > 0;
      const mappedCategory = matchedCategory
        ? matchedCategory.id
        : (product.category || (hasFlavors ? 'liquids' : null));

      return {
        ...product,
        category: mappedCategory,
        flavors: flavorsParsed,
      };
    });
  } catch (error) {
    console.error('Error loading products from API:', error);
    throw error;
  }
};

// Создание нового товара
export const createProduct = async (product) => {
  try {
    const data = await addProduct(product);
    const matchedCategory = categories.find(
      (cat) => cat.name === data.category_name
    );
    let flavorsParsed = {};
    try {
      flavorsParsed = data.flavors ? JSON.parse(data.flavors) : {};
    } catch (_) {
      flavorsParsed = typeof data.flavors === 'object' && data.flavors !== null ? data.flavors : {};
    }
    return {
      ...data,
      category: matchedCategory ? matchedCategory.id : (data.category || null),
      flavors: flavorsParsed,
    };
  } catch (error) {
    console.error('Error creating product in API:', error);
    throw error;
  }
};

// Обновление товара
export const updateProduct = async (id, updates) => {
  try {
    const data = await modifyProduct(id, updates);
    const matchedCategory = categories.find(
      (cat) => cat.name === data.category_name
    );
    let flavorsParsed = {};
    try {
      flavorsParsed = data.flavors ? JSON.parse(data.flavors) : {};
    } catch (_) {
      flavorsParsed = typeof data.flavors === 'object' && data.flavors !== null ? data.flavors : {};
    }
    return {
      ...data,
      category: matchedCategory ? matchedCategory.id : (data.category || null),
      flavors: flavorsParsed,
    };
  } catch (error) {
    console.error('Error updating product in API:', error);
    throw error;
  }
};

// Удаление товара
export const deleteProduct = async (id) => {
  try {
    await removeProduct(id);
  } catch (error) {
    console.error('Error deleting product in API:', error);
    throw error;
  }
};
