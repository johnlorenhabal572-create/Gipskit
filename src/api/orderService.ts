// Helper to get active user headers
function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  try {
    const userStr = localStorage.getItem('gips_user') || localStorage.getItem('currentUser') || localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.role) headers['x-user-role'] = user.role;
      if (user?.email) headers['x-user-email'] = user.email;
    }
  } catch (e) {
    // Ignore JSON parse errors
  }

  return headers;
}

// In-memory cache for ultra-fast local UI updates and synchronous fallbacks
let ordersCache: any[] = [];
let isCacheLoaded = false;

// 1. Fetch orders from MongoDB backend
export async function fetchOrders(filters?: { status?: string; email?: string; orderType?: string; search?: string }): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.email) params.append('email', filters.email);
    if (filters?.orderType) params.append('orderType', filters.orderType);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/orders${queryString}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch orders (${res.status})`);
    }

    const data = await res.json();
    ordersCache = Array.isArray(data) ? data : [];
    isCacheLoaded = true;
    return ordersCache;
  } catch (error) {
    console.warn('Backend orders fetch failed, using cached state:', error);
    return ordersCache;
  }
}

// 2. Create order in MongoDB backend (with automatic stock & inventory deduction)
export async function createOrder(orderData: any): Promise<any> {
  const tempId = orderData.id || `ORD-${Date.now()}`;
  const optimisticOrder = {
    ...orderData,
    id: tempId,
    date: orderData.date || new Date().toISOString(),
    status: orderData.status || 'Pending',
    createdAt: new Date().toISOString()
  };

  // Optimistic update in cache
  ordersCache = [optimisticOrder, ...ordersCache.filter(o => o.id !== tempId)];

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to place order');
    }

    const savedOrder = await res.json();
    // Replace in cache
    ordersCache = ordersCache.map(o => o.id === tempId ? savedOrder : o);
    return savedOrder;
  } catch (error) {
    console.error('Error saving order to MongoDB:', error);
    return optimisticOrder;
  }
}

// 3. Update order status in MongoDB backend
export async function modifyOrderStatus(orderId: string, status: string): Promise<any> {
  // Optimistic update
  ordersCache = ordersCache.map(o => o.id === orderId ? { ...o, status, paymentStatus: (status === 'Paid' || status === 'Completed') ? 'Paid' : o.paymentStatus } : o);

  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });

    if (!res.ok) {
      throw new Error('Failed to update order status');
    }

    const updated = await res.json();
    ordersCache = ordersCache.map(o => o.id === orderId ? updated : o);
    return updated;
  } catch (error) {
    console.error('Error updating order status in MongoDB:', error);
    return ordersCache.find(o => o.id === orderId);
  }
}

// 4. Update order payment details in MongoDB backend
export async function modifyOrderPayment(orderId: string, paymentData: any): Promise<any> {
  // Optimistic update
  ordersCache = ordersCache.map(o => o.id === orderId ? { ...o, ...paymentData } : o);

  try {
    const res = await fetch(`/api/orders/${orderId}/payment`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData)
    });

    if (!res.ok) {
      throw new Error('Failed to update order payment');
    }

    const updated = await res.json();
    ordersCache = ordersCache.map(o => o.id === orderId ? updated : o);
    return updated;
  } catch (error) {
    console.error('Error updating order payment in MongoDB:', error);
    return ordersCache.find(o => o.id === orderId);
  }
}

// 5. Delete order from MongoDB backend
export async function removeOrder(orderId: string): Promise<boolean> {
  ordersCache = ordersCache.filter(o => o.id !== orderId);

  try {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    return res.ok;
  } catch (error) {
    console.error('Error deleting order from MongoDB:', error);
    return false;
  }
}

// 6. Fetch Sales Summary from MongoDB backend
export async function fetchSalesSummary(period: 'day' | 'week' | 'month' | 'year' | 'all' = 'all', date?: Date): Promise<any> {
  try {
    const params = new URLSearchParams();
    params.append('period', period);
    if (date) params.append('date', date.toISOString());

    const res = await fetch(`/api/orders/stats/summary?${params.toString()}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error('Failed to fetch sales summary');
    return await res.json();
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    return null;
  }
}

// 7. Fetch Product Analysis from MongoDB backend
export async function fetchProductAnalysis(): Promise<any> {
  try {
    const res = await fetch('/api/orders/stats/product-analysis', {
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error('Failed to fetch product analysis');
    return await res.json();
  } catch (error) {
    console.error('Error fetching product analysis:', error);
    return null;
  }
}

// -------------------------------------------------------------
// Backwards Compatibility Helpers (for seamless async transition)
// -------------------------------------------------------------

export const getOrders = (): any[] => {
  if (!isCacheLoaded) {
    // Trigger background fetch if not yet loaded
    fetchOrders();
  }
  return ordersCache;
};

export const saveOrder = (orderData: any): any => {
  const tempId = orderData.id || `ORD-${Date.now()}`;
  const newOrder = {
    ...orderData,
    id: tempId,
    date: orderData.date || new Date().toISOString(),
    status: orderData.status || 'Pending'
  };

  createOrder(newOrder);
  return newOrder;
};

export const updateOrderStatus = (orderId: string, newStatus: string): any[] => {
  modifyOrderStatus(orderId, newStatus);
  return ordersCache.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
};

export const updateOrderPayment = (orderId: string, paymentData: any): any[] => {
  modifyOrderPayment(orderId, paymentData);
  return ordersCache.map(o => o.id === orderId ? { ...o, ...paymentData } : o);
};

export const deleteOrder = (orderId: string): any[] => {
  removeOrder(orderId);
  return ordersCache.filter(o => o.id !== orderId);
};

// Initial background load
fetchOrders().catch(() => {});
