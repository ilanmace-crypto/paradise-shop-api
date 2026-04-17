const API_BASE = '/api';

class ApiService {
  static async getProducts() {
    try {
      const response = await fetch(`${API_BASE}/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  static async createOrder(orderData) {
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create order');
      }
      return await response.json();
    } catch (error) {
      console.error('Order error:', error);
      throw error;
    }
  }

  static async getReviews(productId) {
    try {
      const response = await fetch(`${API_BASE}/reviews/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return await response.json();
    } catch (error) {
      console.error('Reviews error:', error);
      return [];
    }
  }
}

export default ApiService;
