// Authorization headers helper from current user session
export const getAuthHeaders = (): Record<string, string> => {
  try {
    const savedUser = localStorage.getItem('capstone_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return {
        'Content-Type': 'application/json',
        'x-user-role': parsed.role || 'customer',
        'x-user-email': parsed.email || '',
        'x-user-name': parsed.name || ''
      };
    }
  } catch (err) {
    console.error('Error reading auth headers in inventoryService:', err);
  }
  return { 'Content-Type': 'application/json' };
};

// In-memory runtime cache (no localStorage dependency for permanent storage)
let cachedInventory: any[] = [];
let isCacheLoaded = false;

// 1. Fetch all inventory items from MongoDB Atlas via REST API
export const fetchInventory = async (filters?: { search?: string; lowStock?: boolean }): Promise<any[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.lowStock) params.append('lowStock', 'true');

    const url = `/api/inventory${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch inventory: ${res.status}`);
    }

    const data = await res.json();
    cachedInventory = Array.isArray(data) ? data : [];
    isCacheLoaded = true;
    return cachedInventory;
  } catch (error) {
    console.error('Error in fetchInventory API:', error);
    return cachedInventory;
  }
};

// 2. Fetch reorder items (low stock)
export const fetchReorderList = async (): Promise<any[]> => {
  try {
    const res = await fetch('/api/inventory/reorder', {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error('Failed to fetch reorder items');
    }
    return await res.json();
  } catch (error) {
    console.error('Error in fetchReorderList:', error);
    return cachedInventory.filter(i => i.quantity <= (i.lowStockThreshold || 10));
  }
};

// 3. Fetch inventory audit/history logs
export const fetchInventoryLogs = async (inventoryId?: string, limit = 100): Promise<any[]> => {
  try {
    const params = new URLSearchParams();
    if (inventoryId) params.append('inventoryId', inventoryId);
    if (limit) params.append('limit', String(limit));

    const res = await fetch(`/api/inventory/logs?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error('Failed to fetch inventory history logs');
    }
    return await res.json();
  } catch (error) {
    console.error('Error in fetchInventoryLogs:', error);
    return [];
  }
};

// 4. Fetch single inventory item by ID
export const fetchInventoryItem = async (id: string): Promise<any> => {
  try {
    const res = await fetch(`/api/inventory/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch inventory item ${id}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Error in fetchInventoryItem(${id}):`, error);
    return cachedInventory.find(i => i.id === id);
  }
};

// 5. Create new inventory item in MongoDB Atlas
export const createInventoryItem = async (newItem: any): Promise<any> => {
  const payload = {
    id: newItem.id || undefined,
    name: newItem.name?.trim(),
    quantity: Number(newItem.quantity || 0),
    unit: newItem.unit?.trim() || 'pcs',
    stableQuantity: Number(newItem.stableQuantity || 0),
    lowStockThreshold: Number(newItem.lowStockThreshold || 10)
  };

  const res = await fetch('/api/inventory', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to add inventory item');
  }

  const created = data.item || data;
  cachedInventory.push(created);
  return created;
};

// 6. Update inventory item in MongoDB Atlas
export const updateInventoryItem = async (id: string, updatedData: any): Promise<any> => {
  const res = await fetch(`/api/inventory/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updatedData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update inventory item');
  }

  const updated = data.item || data;
  cachedInventory = cachedInventory.map(i => (i.id === id ? updated : i));
  return updated;
};

// 7. Adjust stock (Stock-in, Stock-out, Manual adjustment, Order deduction)
export const adjustInventoryStock = async (
  id: string,
  options: {
    type: 'stock-in' | 'stock-out' | 'manual-adjustment' | 'order-deduction';
    amount?: number;
    newQuantity?: number;
    reason?: string;
    orderId?: string;
  }
): Promise<any> => {
  const res = await fetch(`/api/inventory/${id}/stock`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(options)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to adjust stock');
  }

  if (data.item) {
    cachedInventory = cachedInventory.map(i => (i.id === id ? data.item : i));
  }
  return data;
};

// 8. Delete inventory item in MongoDB Atlas
export const deleteInventoryItem = async (id: string): Promise<any> => {
  const res = await fetch(`/api/inventory/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete inventory item');
  }

  cachedInventory = cachedInventory.filter(i => i.id !== id);
  return data;
};

// Backward-compatible synchronous accessors
export const getInventory = () => {
  if (!isCacheLoaded) {
    fetchInventory().catch(console.error);
  }
  return cachedInventory;
};

export const saveInventory = (items: any[]) => {
  cachedInventory = items;
};

export const deductInventory = (inventoryId: string, amount: number, orderId?: string) => {
  adjustInventoryStock(inventoryId, {
    type: 'order-deduction',
    amount,
    reason: `Deduction for order #${orderId || 'POS'}`
  }).catch(console.error);

  cachedInventory = cachedInventory.map((item: any) => {
    if (item.id === inventoryId) {
      return { ...item, quantity: Math.max(0, item.quantity - amount) };
    }
    return item;
  });
};
