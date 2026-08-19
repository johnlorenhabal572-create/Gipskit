import { deductInventory } from './inventoryService';

export const saveOrder = (orderData) => {
  const storedOrders = localStorage.getItem('capstone_orders');
  const orders = storedOrders ? JSON.parse(storedOrders) : [];

  const newOrder = {
    ...orderData,
    id: `ORD-${Date.now()}`,
    date: new Date().toISOString(),
    status: orderData.status || 'Pending'
  };

  // Deduct inventory if items are linked
  newOrder.items.forEach((item: any) => {
    if (item.inventoryLinkId) {
      deductInventory(item.inventoryLinkId, item.quantity);
    }
  });

  orders.push(newOrder);
  localStorage.setItem('capstone_orders', JSON.stringify(orders));
  return newOrder;
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