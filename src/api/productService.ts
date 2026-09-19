import { getInventory, fetchInventory } from './inventoryService';

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

// Async API: Fetch dynamic categories from server
export const fetchCategories = async (): Promise<string[]> => {
  try {
    const res = await fetch('/api/categories', {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      return CATEGORIES;
    }
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : CATEGORIES;
  } catch (err) {
    console.error('Error fetching categories:', err);
    return CATEGORIES;
  }
};

// Async API: Create new category (Admin/Staff)
export const createCategory = async (name: string): Promise<any> => {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name: name.trim() })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create category');
  }
  return data;
};

// Async API: Delete category (Admin/Staff)
export const deleteCategory = async (name: string): Promise<any> => {
  const res = await fetch(`/api/categories/${encodeURIComponent(name.trim())}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete category');
  }
  return data;
};

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

    // Concurrently fetch products and ensure inventory is fully loaded from backend
    const [productsResult, inventoryResult] = await Promise.allSettled([
      fetch(url, { headers: getAuthHeaders() }),
      fetchInventory()
    ]);

    if (productsResult.status !== 'fulfilled' || !productsResult.value.ok) {
      const errorData = productsResult.status === 'fulfilled'
        ? await productsResult.value.json().catch(() => ({}))
        : {};
      const status = productsResult.status === 'fulfilled' ? productsResult.value.status : 'Network Error';
      throw new Error(errorData.error || `Failed to fetch products: ${status}`);
    }

    const data = await productsResult.value.json();
    const rawProducts = Array.isArray(data) ? data : [];

    // Determine inventory data availability
    let inventoryList: any[] = [];
    let isInventoryReady = false;

    if (inventoryResult.status === 'fulfilled' && Array.isArray(inventoryResult.value)) {
      inventoryList = inventoryResult.value;
      isInventoryReady = true;
    } else {
      console.warn('Inventory fetch could not be fulfilled directly; checking inventory cache');
      const cached = getInventory();
      if (Array.isArray(cached) && cached.length > 0) {
        inventoryList = cached;
        isInventoryReady = true;
      }
    }

    // Merge inventory stock levels for linked items
    const mappedProducts = rawProducts.map((p: any) => {
      const linkIds: string[] = Array.isArray(p.inventoryLinkIds) && p.inventoryLinkIds.length > 0
        ? p.inventoryLinkIds
        : (p.inventoryLinkId ? [p.inventoryLinkId] : []);

      if (linkIds.length > 0) {
        if (isInventoryReady) {
          const quantities = linkIds.map(id => {
            const invItem = inventoryList.find((i: any) => String(i.id) === String(id) || String(i._id) === String(id));
            return invItem ? Number(invItem.quantity ?? 0) : 0;
          });
          const availableStock = Math.min(...quantities);
          return { 
            ...p, 
            stock: availableStock, 
            inventoryLinkId: linkIds[0] || null, 
            inventoryLinkIds: linkIds 
          };
        } else {
          // If inventory API failed and no cache is available, do not silently wipe stock to 0.
          // Preserve existing product stock so items are not falsely displayed as Out of Stock.
          return {
            ...p,
            inventoryLinkId: linkIds[0] || null,
            inventoryLinkIds: linkIds
          };
        }
      }
      return p;
    });

    cachedProducts = mappedProducts;
    isCacheLoaded = true;

    return mappedProducts;
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
  const linkIds: string[] = Array.isArray(newProduct.inventoryLinkIds)
    ? newProduct.inventoryLinkIds.filter(Boolean)
    : (newProduct.inventoryLinkId ? [newProduct.inventoryLinkId] : []);

  const payload = {
    ...newProduct,
    name: newProduct.name?.trim(),
    price: Number(newProduct.price),
    category: newProduct.category?.trim(),
    stock: Number(newProduct.stock || 0),
    image: newProduct.image || '',
    inventoryLinkId: linkIds[0] || null,
    inventoryLinkIds: linkIds,
    ingredients: Array.isArray(newProduct.ingredients) ? newProduct.ingredients : [],
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
  let payload = { ...updatedData };
  if (updatedData.inventoryLinkIds !== undefined || updatedData.inventoryLinkId !== undefined) {
    const linkIds: string[] = Array.isArray(updatedData.inventoryLinkIds)
      ? updatedData.inventoryLinkIds.filter(Boolean)
      : (updatedData.inventoryLinkId ? [updatedData.inventoryLinkId] : []);
    payload.inventoryLinkIds = linkIds;
    payload.inventoryLinkId = linkIds[0] || null;
  }
  if (updatedData.ingredients !== undefined) {
    payload.ingredients = Array.isArray(updatedData.ingredients) ? updatedData.ingredients : [];
  }

  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
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
  const hasInventory = Array.isArray(inventory) && inventory.length > 0;

  return cachedProducts.map((p: any) => {
    const linkIds: string[] = Array.isArray(p.inventoryLinkIds) && p.inventoryLinkIds.length > 0
      ? p.inventoryLinkIds
      : (p.inventoryLinkId ? [p.inventoryLinkId] : []);

    if (linkIds.length > 0) {
      if (hasInventory) {
        const quantities = linkIds.map(id => {
          const invItem = inventory.find((i: any) => String(i.id) === String(id) || String(i._id) === String(id));
          return invItem ? Number(invItem.quantity ?? 0) : 0;
        });
        const availableStock = Math.min(...quantities);
        return { 
          ...p, 
          stock: availableStock, 
          inventoryLinkId: linkIds[0] || null, 
          inventoryLinkIds: linkIds 
        };
      }
      return {
        ...p,
        inventoryLinkId: linkIds[0] || null,
        inventoryLinkIds: linkIds
      };
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
