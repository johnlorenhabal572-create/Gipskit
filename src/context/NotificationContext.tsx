import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  fetchNotificationCounts, 
  markCustomerNotificationsRead, 
  markAdminOrdersRead, 
  acknowledgeAdminInventoryAlerts,
  NotificationCounts 
} from '../api/notificationService';
import { AuthContext } from './AuthContext';

interface NotificationContextType {
  customerOrderUpdates: number;
  adminNewOrders: number;
  adminLowStock: number;
  lowStockItems: NotificationCounts['lowStockItems'];
  refreshNotifications: () => Promise<void>;
  markCustomerOrdersRead: (orderIds?: string[]) => Promise<void>;
  markAdminOrdersAsRead: (orderIds?: string[]) => Promise<void>;
  acknowledgeLowStock: (itemIds?: string[]) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  customerOrderUpdates: 0,
  adminNewOrders: 0,
  adminLowStock: 0,
  lowStockItems: [],
  refreshNotifications: async () => {},
  markCustomerOrdersRead: async () => {},
  markAdminOrdersAsRead: async () => {},
  acknowledgeLowStock: async () => {}
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useContext(AuthContext) as any;
  const [counts, setCounts] = useState<NotificationCounts>({
    customerOrderUpdates: 0,
    adminNewOrders: 0,
    adminLowStock: 0,
    lowStockItems: []
  });

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await fetchNotificationCounts();
      setCounts(data);
    } catch (err) {
      console.warn('Error refreshing notifications:', err);
    }
  }, []);

  // Poll notifications automatically every 5 seconds without full page reload
  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 5000);
    return () => clearInterval(interval);
  }, [user, refreshNotifications]);

  const markCustomerOrdersReadHandler = async (orderIds?: string[]) => {
    // Optimistically update UI
    setCounts(prev => ({ ...prev, customerOrderUpdates: 0 }));
    await markCustomerNotificationsRead(orderIds);
    await refreshNotifications();
  };

  const markAdminOrdersAsReadHandler = async (orderIds?: string[]) => {
    // Optimistically update UI
    setCounts(prev => ({ ...prev, adminNewOrders: 0 }));
    await markAdminOrdersRead(orderIds);
    await refreshNotifications();
  };

  const acknowledgeLowStockHandler = async (itemIds?: string[]) => {
    // Optimistically update UI
    setCounts(prev => ({ ...prev, adminLowStock: 0 }));
    await acknowledgeAdminInventoryAlerts(itemIds);
    await refreshNotifications();
  };

  return (
    <NotificationContext.Provider
      value={{
        customerOrderUpdates: counts.customerOrderUpdates,
        adminNewOrders: counts.adminNewOrders,
        adminLowStock: counts.adminLowStock,
        lowStockItems: counts.lowStockItems,
        refreshNotifications,
        markCustomerOrdersRead: markCustomerOrdersReadHandler,
        markAdminOrdersAsRead: markAdminOrdersAsReadHandler,
        acknowledgeLowStock: acknowledgeLowStockHandler
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
