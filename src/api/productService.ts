import { getInventory } from './inventoryService';

export const CATEGORIES = [
  "Soups",
  "Sandwiches",
  "Value Meals",
  "Breakfast",
  "Vegetables",
  "Pork",
  "Chicken",
  "Seafood",
  "Appetizers",
  "Rice",
  "Salads",
  "Beverages"
];

// Helper to get authorization headers from current session
export const getAuthHeaders = (): Record<string, string> => {
  try {
    const savedUser = localStorage.getItem('capstone_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return {
        'Content-Type': 'application/json',
        'x-user-role': parsed.role || 'customer',
        'x-user-email': parsed.email || ''
      };
    }
  } catch (err) {
    console.error('Error reading auth headers:', err);
  }
  return { 'Content-Type': 'application/json' };
};

// In-memory runtime cache (no localStorage dependency for permanent storage)
let cachedProducts: any[] = [];
let isCacheLoaded = false;

// Async API: Fetch all products from MongoDB Atlas via REST API
export const fetchProducts = async (filters?: { category?: string; search?: string; availableOnly?: boolean }): Promise<any[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.availableOnly) params.append('availableOnly', 'true');

    const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch products: ${res.status}`);
    }

    const data = await res.json();
    cachedProducts = Array.isArray(data) ? data : [];
    isCacheLoaded = true;

    // Merge inventory stock levels for linked items (if raw inventory exists)
    const inventory = getInventory();
    return cachedProducts.map((p: any) => {
      if (p.inventoryLinkId) {
        const invItem = inventory.find((i: any) => i.id === p.inventoryLinkId);
        return { ...p, stock: invItem ? invItem.quantity : (p.stock || 0) };
      }
      return p;
    });
  } catch (error) {
    console.error('Error in fetchProducts API:', error);
    // Return cached products if available
    return cachedProducts;
  }
};

// Async API: Get single product by ID
export const fetchProductById = async (id: number | string): Promise<any> => {
  try {
    const res = await fetch(`/api/products/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch product ${id}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Error in fetchProductById(${id}):`, error);
    return cachedProducts.find(p => p.id === Number(id) || p.id === id);
  }
};

// Async API: Create new product in MongoDB Atlas
export const createProduct = async (newProduct: any): Promise<any> => {
  const payload = {
    name: newProduct.name?.trim(),
    price: Number(newProduct.price),
    category: newProduct.category?.trim(),
    stock: Number(newProduct.stock || 0),
    image: newProduct.image || '',
    inventoryLinkId: newProduct.inventoryLinkId || null,
    status: newProduct.status || 'Available',
    description: newProduct.description || ''
  };

  const res = await fetch('/api/products', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create product');
  }

  const created = data.product || data;
  cachedProducts.push(created);
  return created;
};

// Async API: Update existing product in MongoDB Atlas
export const editProduct = async (id: number | string, updatedData: any): Promise<any> => {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updatedData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update product');
  }

  const updated = data.product || data;
  cachedProducts = cachedProducts.map(p => (p.id === Number(id) || p.id === id ? updated : p));
  return updated;
};

// Async API: Delete product in MongoDB Atlas
export const removeProduct = async (id: number | string): Promise<any> => {
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete product');
  }

  cachedProducts = cachedProducts.filter(p => p.id !== Number(id) && p.id !== id);
  return data;
};

// Synchronous Fallback & Cache Accessors for Existing Components
export const getProducts = () => {
  if (!isCacheLoaded) {
    // Trigger background async load
    fetchProducts().catch(console.error);
  }

  const inventory = getInventory();
  return cachedProducts.map((p: any) => {
    if (p.inventoryLinkId) {
      const invItem = inventory.find((i: any) => i.id === p.inventoryLinkId);
      return { ...p, stock: invItem ? invItem.quantity : (p.stock || 0) };
    }
    return p;
  });
};

export const saveProducts = (products: any[]) => {
  cachedProducts = products;
};

export const addProduct = (newProduct: any) => {
  const productWithId = { ...newProduct, id: newProduct.id || Date.now() };
  createProduct(productWithId).catch(console.error);
  cachedProducts.push(productWithId);
  return productWithId;
};

export const updateProduct = (updatedProduct: any) => {
  editProduct(updatedProduct.id, updatedProduct).catch(console.error);
  cachedProducts = cachedProducts.map((p: any) => p.id === updatedProduct.id ? updatedProduct : p);
};

export const deleteProduct = (productId: number | string) => {
  removeProduct(productId).catch(console.error);
  cachedProducts = cachedProducts.filter((p: any) => p.id !== productId && p.id !== Number(productId));
};
