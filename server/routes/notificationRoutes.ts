import { Router, Request, Response } from 'express';
import { Order, InventoryItem } from '../models';
import { getDbStatus, memoryStore } from '../db';

const router = Router();

// Helper to get performer details
function getRequesterInfo(req: Request) {
  const role = (req.headers['x-user-role'] as string) || 'customer';
  const email = (req.headers['x-user-email'] as string) || '';
  return { role, email };
}

// 1. GET /api/notifications/counts - Get active unread counts for customer and admin
router.get('/counts', async (req: Request, res: Response) => {
  try {
    const { role, email } = getRequesterInfo(req);
    const myOrderIdsRaw = (req.query.myOrderIds as string) || '';
    const myOrderIds = myOrderIdsRaw ? myOrderIdsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    const { isConnected } = await getDbStatus();

    let customerOrderUpdates = 0;
    let adminNewOrders = 0;
    let adminLowStock = 0;
    let lowStockItems: any[] = [];

    if (isConnected) {
      // Customer Notifications: Find orders belonging to this user
      if (email || myOrderIds.length > 0) {
        const queryConds: any[] = [];
        if (email) {
          queryConds.push({ userEmail: email });
          queryConds.push({ 'customer.email': email });
        }
        if (myOrderIds.length > 0) {
          queryConds.push({ id: { $in: myOrderIds } });
        }

        const customerOrders = await Order.find({
          $or: queryConds,
          status: { $ne: 'Pending' }
        }).select('id status customerViewedStatus updatedAt');

        for (const order of customerOrders) {
          // If customerViewedStatus does not match current order status, it is unread!
          if (!order.customerViewedStatus || order.customerViewedStatus !== order.status) {
            customerOrderUpdates++;
          }
        }
      }

      // Admin Notifications: Only computed if role is admin or staff
      if (role === 'admin' || role === 'staff') {
        adminNewOrders = await Order.countDocuments({
          adminViewed: { $ne: true }
        });

        const allInventory = await InventoryItem.find({}).select('id name quantity unit lowStockThreshold lowStockAcknowledged');
        for (const item of allInventory) {
          const threshold = item.lowStockThreshold !== undefined ? item.lowStockThreshold : 10;
          if (item.quantity <= threshold) {
            lowStockItems.push({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              lowStockThreshold: threshold,
              acknowledged: item.lowStockAcknowledged === true
            });
            if (item.lowStockAcknowledged !== true) {
              adminLowStock++;
            }
          }
        }
      }
    } else {
      // Memory Store fallback
      if (email || myOrderIds.length > 0) {
        const customerOrders = memoryStore.orders.filter(order => {
          const matchesEmail = email && (order.userEmail === email || order.customer?.email === email);
          const matchesId = myOrderIds.includes(order.id);
          return (matchesEmail || matchesId) && order.status !== 'Pending';
        });

        for (const order of customerOrders) {
          if (!order.customerViewedStatus || order.customerViewedStatus !== order.status) {
            customerOrderUpdates++;
          }
        }
      }

      if (role === 'admin' || role === 'staff') {
        adminNewOrders = memoryStore.orders.filter(order => order.adminViewed !== true).length;

        for (const item of memoryStore.inventory) {
          const threshold = item.lowStockThreshold !== undefined ? item.lowStockThreshold : 10;
          if (item.quantity <= threshold) {
            lowStockItems.push({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              lowStockThreshold: threshold,
              acknowledged: item.lowStockAcknowledged === true
            });
            if (item.lowStockAcknowledged !== true) {
              adminLowStock++;
            }
          }
        }
      }
    }

    return res.json({
      customerOrderUpdates,
      adminNewOrders,
      adminLowStock,
      lowStockItems
    });
  } catch (error: any) {
    console.error('Error fetching notification counts:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// 2. POST /api/notifications/customer/mark-read - Mark customer order updates as viewed
router.post('/customer/mark-read', async (req: Request, res: Response) => {
  try {
    const { email } = getRequesterInfo(req);
    const { orderIds, email: bodyEmail } = req.body;
    const targetEmail = bodyEmail || email;
    const ids: string[] = Array.isArray(orderIds) ? orderIds : [];

    const { isConnected } = await getDbStatus();

    if (isConnected) {
      const queryConds: any[] = [];
      if (targetEmail) {
        queryConds.push({ userEmail: targetEmail });
        queryConds.push({ 'customer.email': targetEmail });
      }
      if (ids.length > 0) {
        queryConds.push({ id: { $in: ids } });
      }

      if (queryConds.length > 0) {
        const orders = await Order.find({ $or: queryConds });
        const now = new Date();
        for (const order of orders) {
          order.customerViewedStatus = order.status;
          order.customerLastViewedAt = now;
          await order.save();
        }
      }
    } else {
      const now = new Date();
      for (const order of memoryStore.orders) {
        const matchesEmail = targetEmail && (order.userEmail === targetEmail || order.customer?.email === targetEmail);
        const matchesId = ids.includes(order.id);
        if (matchesEmail || matchesId) {
          order.customerViewedStatus = order.status;
          order.customerLastViewedAt = now;
        }
      }
    }

    return res.json({ success: true, message: 'Customer notifications marked as read' });
  } catch (error: any) {
    console.error('Error marking customer notifications read:', error);
    res.status(500).json({ error: 'Failed to mark notifications read' });
  }
});

// 3. POST /api/notifications/admin/mark-orders-read - Mark admin new orders as viewed
router.post('/admin/mark-orders-read', async (req: Request, res: Response) => {
  try {
    const { orderIds } = req.body;
    const ids: string[] = Array.isArray(orderIds) ? orderIds : [];

    const { isConnected } = await getDbStatus();
    const now = new Date();

    if (isConnected) {
      const filter: any = ids.length > 0 ? { id: { $in: ids } } : { adminViewed: { $ne: true } };
      await Order.updateMany(filter, {
        $set: { adminViewed: true, adminViewedAt: now }
      });
    } else {
      for (const order of memoryStore.orders) {
        if (ids.length === 0 || ids.includes(order.id)) {
          order.adminViewed = true;
          order.adminViewedAt = now;
        }
      }
    }

    return res.json({ success: true, message: 'Admin orders marked as read' });
  } catch (error: any) {
    console.error('Error marking admin orders read:', error);
    res.status(500).json({ error: 'Failed to mark admin orders read' });
  }
});

// 4. POST /api/notifications/admin/acknowledge-inventory - Acknowledge low stock items
router.post('/admin/acknowledge-inventory', async (req: Request, res: Response) => {
  try {
    const { itemIds } = req.body;
    const ids: string[] = Array.isArray(itemIds) ? itemIds : [];

    const { isConnected } = await getDbStatus();
    const now = new Date();

    if (isConnected) {
      if (ids.length > 0) {
        await InventoryItem.updateMany(
          { id: { $in: ids } },
          { $set: { lowStockAcknowledged: true, lowStockAcknowledgedAt: now } }
        );
      } else {
        // Acknowledge all currently low-stock items
        const allItems = await InventoryItem.find({});
        for (const item of allItems) {
          const threshold = item.lowStockThreshold !== undefined ? item.lowStockThreshold : 10;
          if (item.quantity <= threshold) {
            item.lowStockAcknowledged = true;
            item.lowStockAcknowledgedAt = now;
            await item.save();
          }
        }
      }
    } else {
      for (const item of memoryStore.inventory) {
        const threshold = item.lowStockThreshold !== undefined ? item.lowStockThreshold : 10;
        if (ids.length === 0 ? item.quantity <= threshold : ids.includes(item.id)) {
          item.lowStockAcknowledged = true;
          item.lowStockAcknowledgedAt = now;
        }
      }
    }

    return res.json({ success: true, message: 'Low stock alerts acknowledged' });
  } catch (error: any) {
    console.error('Error acknowledging inventory alerts:', error);
    res.status(500).json({ error: 'Failed to acknowledge inventory alerts' });
  }
});

export default router;
