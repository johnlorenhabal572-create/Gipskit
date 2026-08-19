import { deductInventory } from './inventoryService';
import { getProducts, saveProducts } from './productService';

export const saveOrder = (orderData) => {
  const storedOrders = localStorage.getItem('capstone_orders');
  const orders = storedOrders ? JSON.parse(storedOrders) : [];
  const products = getProducts();

  const newOrder = {
    ...orderData,
    id: `ORD-${Date.now()}`,
    date: new Date().toISOString(),
    status: orderData.status || 'Pending'
  };

  // Deduct inventory if items are linked, else deduct from product stock
  newOrder.items.forEach((item: any) => {
    if (item.inventoryLinkId) {
      deductInventory(item.inventoryLinkId, item.quantity);
    } else {
      // Manual Stock Deduction
      const productIdx = products.findIndex((p: any) => p.id === item.id);
      if (productIdx !== -1) {
        products[productIdx].stock = Math.max(0, products[productIdx].stock - item.quantity);
      }
    }
  });
  
  // Save updated product stock for non-linked items
  saveProducts(products);

  orders.push(newOrder);
  localStorage.setItem('capstone_orders', JSON.stringify(orders));
  return newOrder;
};

export const updateOrderPayment = (orderId, paymentData) => {
  const orders = getOrders();
  const updatedOrders = orders.map(order => 
    order.id === orderId ? { ...order, ...paymentData } : order
  );
  localStorage.setItem('capstone_orders', JSON.stringify(updatedOrders));
  return updatedOrders;
};

export const getOrders = () => {
  const storedOrders = localStorage.getItem('capstone_orders');
  return storedOrders ? JSON.parse(storedOrders) : [];
};

export const updateOrderStatus = (orderId, newStatus) => {
  const orders = getOrders();
  
  // Map through orders, find the matching ID, and update its status
  const updatedOrders = orders.map(order => 
    order.id === orderId ? { ...order, status: newStatus } : order
  );
  
  localStorage.setItem('capstone_orders', JSON.stringify(updatedOrders));
  return updatedOrders; // Return the new list so the React component can update
};

export const deleteOrder = (orderId: string) => {
  const orders = getOrders();
  const updatedOrders = orders.filter(order => order.id !== orderId);
  localStorage.setItem('capstone_orders', JSON.stringify(updatedOrders));
  return updatedOrders;
};