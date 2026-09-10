import { Router, Request, Response } from 'express';
import { Order, Product, InventoryItem, InventoryLog, User } from '../models';
import { getDbStatus, memoryStore } from '../db';
import { sendOrderStatusEmail } from '../email';

const router = Router();

// Helper: auth verification
function getUserRole(req: Request): string {
  return (req.headers['x-user-role'] as string) || '';
}

function getUserEmail(req: Request): string {
  return (req.headers['x-user-email'] as string) || '';
}

// 1. GET /api/orders - Get all orders or filter
router.get('/', async (req: Request, res: Response) => {
  try {
    const { isConnected } = await getDbStatus();
    const { status, email, orderType, search } = req.query;

    if (isConnected) {
      const query: any = {};
      if (status && status !== 'All') {
        query.status = status;
      }
      if (email) {
        query.userEmail = email;
      }
      if (orderType) {
        query.orderType = orderType;
      }
      if (search && typeof search === 'string') {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
          { id: searchRegex },
          { 'customer.name': searchRegex },
          { 'customer.phone': searchRegex }
        ];
      }

      const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
      return res.json(orders);
    }

    // In-memory fallback
    let list = [...memoryStore.orders];
    if (status && status !== 'All') {
      list = list.filter(o => o.status === status);
    }
    if (email) {
      list = list.filter(o => o.userEmail === email);
    }
    if (orderType) {
      list = list.filter(o => o.orderType === orderType);
    }
    if (search && typeof search === 'string') {
      const s = search.toLowerCase();
      list = list.filter(o => 
        o.id?.toLowerCase().includes(s) || 
        o.customer?.name?.toLowerCase().includes(s) ||
        o.customer?.phone?.toLowerCase().includes(s)
      );
    }

    list.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    return res.json(list);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// 2. GET /api/orders/stats/summary - Comprehensive sales statistics
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const { isConnected } = await getDbStatus();
    const { period, date } = req.query; // period: 'day' | 'week' | 'month' | 'year' | 'all'

    let orders: any[] = [];
    if (isConnected) {
      orders = await Order.find({ status: 'Completed' }).lean();
    } else {
      orders = memoryStore.orders.filter(o => o.status === 'Completed');
    }

    const targetDate = date ? new Date(date as string) : new Date();

    // Filter by period
    const filtered = orders.filter(o => {
      const orderDate = new Date(o.date || o.createdAt);
      if (period === 'day') {
        return orderDate.toDateString() === targetDate.toDateString();
      }
      if (period === 'week') {
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        return orderDate >= startOfWeek && orderDate < endOfWeek;
      }
      if (period === 'month') {
        return (
          orderDate.getFullYear() === targetDate.getFullYear() &&
          orderDate.getMonth() === targetDate.getMonth()
        );
      }
      if (period === 'year') {
        return orderDate.getFullYear() === targetDate.getFullYear();
      }
      return true; // 'all'
    });

    const totalRevenue = filtered.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const transactionCount = filtered.length;
    const averageOrderValue = transactionCount > 0 ? Math.round(totalRevenue / transactionCount) : 0;

    // Payment methods breakdown
    const paymentMethods: { [key: string]: number } = {};
    filtered.forEach(o => {
      const method = o.paymentMethod || 'Cash';
      paymentMethods[method] = (paymentMethods[method] || 0) + (Number(o.total) || 0);
    });

    return res.json({
      period: period || 'all',
      totalRevenue,
      transactionCount,
      averageOrderValue,
      paymentMethods,
      orders: filtered
    });
  } catch (error) {
    console.error('Error calculating sales summary:', error);
    res.status(500).json({ error: 'Failed to calculate sales summary' });
  }
});

// 3. GET /api/orders/stats/product-analysis - Best & least selling items
router.get('/stats/product-analysis', async (req: Request, res: Response) => {
  try {
    const { isConnected } = await getDbStatus();
    const { period } = req.query;

    let orders: any[] = [];
    if (isConnected) {
      orders = await Order.find({ status: 'Completed' }).lean();
    } else {
      orders = memoryStore.orders.filter(o => o.status === 'Completed');
    }

    const productMap: { [name: string]: { name: string; quantity: number; revenue: number; category?: string } } = {};

    orders.forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const name = item.name || 'Unknown Item';
          if (!productMap[name]) {
            productMap[name] = {
              name,
              quantity: 0,
              revenue: 0,
              category: item.category || ''
            };
          }
          const qty = Number(item.quantity) || 0;
          const price = Number(item.price) || 0;
          productMap[name].quantity += qty;
          productMap[name].revenue += (price * qty);
        });
      }
    });

    const productList = Object.values(productMap);
    const bestSelling = [...productList].sort((a, b) => b.quantity - a.quantity);
    const leastSelling = [...productList].sort((a, b) => a.quantity - b.quantity);

    return res.json({
      allProducts: productList,
      bestSelling: bestSelling.slice(0, 10),
      leastSelling: leastSelling.slice(0, 10),
      totalProductsTracked: productList.length
    });
  } catch (error) {
    console.error('Error fetching product analysis:', error);
    res.status(500).json({ error: 'Failed to fetch product analysis' });
  }
});

// 4. GET /api/orders/:id - Single order
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isConnected } = await getDbStatus();

    if (isConnected) {
      const order = await Order.findOne({ id }).lean();
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      return res.json(order);
    }

    const order = memoryStore.orders.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// 5. POST /api/orders - Create and process order + auto-deduct inventory
router.post('/', async (req: Request, res: Response) => {
  try {
    const { items, customer, total, subtotal, amountPaid, change, paymentMethod, orderType, status, paymentStatus, userEmail, userName } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const calculatedTotal = total !== undefined ? Number(total) : items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const orderId = req.body.id || `ORD-${Date.now()}`;
    const orderDate = req.body.date ? new Date(req.body.date) : new Date();
    const finalOrderType = orderType || (req.body.orderType || 'Online');
    const finalStatus = status || (finalOrderType === 'POS' ? 'Completed' : 'Pending');
    const finalPaymentStatus = paymentStatus || (finalStatus === 'Completed' ? 'Paid' : 'Unpaid');

    const performerEmail = getUserEmail(req) || userEmail || 'system';

    const orderDoc = {
      id: orderId,
      customer: {
        name: customer?.name || 'Walk-in Customer',
        email: customer?.email || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        facebook: customer?.facebook || ''
      },
      userEmail: userEmail || '',
      userName: userName || customer?.name || '',
      items: items.map(item => {
        const linkIds: string[] = Array.isArray(item.inventoryLinkIds) && item.inventoryLinkIds.length > 0
          ? item.inventoryLinkIds
          : (item.inventoryLinkId ? [item.inventoryLinkId] : []);
        return {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          inventoryLinkId: linkIds[0] || null,
          inventoryLinkIds: linkIds,
          unit: item.unit || 'pcs',
          image: item.image || '',
          category: item.category || ''
        };
      }),
      subtotal: subtotal !== undefined ? Number(subtotal) : calculatedTotal,
      total: calculatedTotal,
      amountPaid: amountPaid ? Number(amountPaid) : 0,
      change: change ? Number(change) : 0,
      paymentMethod: paymentMethod || 'Cash',
      paymentStatus: finalPaymentStatus,
      status: finalStatus,
      orderType: finalOrderType,
      paymentScreenshot: req.body.paymentScreenshot || '',
      adminViewed: finalOrderType === 'POS' ? true : false,
      adminViewedAt: finalOrderType === 'POS' ? new Date() : null,
      customerViewedStatus: finalStatus,
      customerLastViewedAt: new Date(),
      date: orderDate
    };

    const { isConnected } = await getDbStatus();

    // Auto-deduct inventory/product stock
    if (isConnected) {
      for (const item of items) {
        const qty = Number(item.quantity) || 1;
        let linkIds: string[] = [];
        if (Array.isArray(item.inventoryLinkIds) && item.inventoryLinkIds.length > 0) {
          linkIds = item.inventoryLinkIds;
        } else if (item.inventoryLinkId) {
          linkIds = [item.inventoryLinkId];
        } else {
          const numId = Number(item.id);
          const prod = !isNaN(numId) ? await Product.findOne({ id: numId }) : null;
          if (prod) {
            if (Array.isArray(prod.inventoryLinkIds) && prod.inventoryLinkIds.length > 0) {
              linkIds = prod.inventoryLinkIds;
            } else if (prod.inventoryLinkId) {
              linkIds = [prod.inventoryLinkId];
            }
          }
        }

        if (linkIds.length > 0) {
          // Deduct from all linked InventoryItems
          for (const invId of linkIds) {
            const invItem = await InventoryItem.findOne({ id: invId });
            if (invItem) {
              const prevQty = invItem.quantity;
              const newQty = Math.max(0, prevQty - qty);
              invItem.quantity = newQty;
              const threshold = invItem.lowStockThreshold || 10;
              if (newQty <= threshold && prevQty > threshold) {
                invItem.lowStockAcknowledged = false;
              }
              await invItem.save();

              // Log the order deduction
              await InventoryLog.create({
                id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                inventoryId: invId,
                itemName: invItem.name,
                type: 'order-deduction',
                quantityChange: -qty,
                remainingQuantity: newQty,
                reason: `Auto-deducted for Order ${orderId}`,
                orderId,
                performedBy: performerEmail,
                date: new Date()
              });
            }
          }
        } else {
          // Manual product stock deduction
          const numId = Number(item.id);
          const prod = !isNaN(numId) ? await Product.findOne({ id: numId }) : null;
          if (prod) {
            prod.stock = Math.max(0, (prod.stock || 0) - qty);
            await prod.save();
          }
        }
      }

      const createdOrder = await Order.create(orderDoc);
      return res.status(201).json(createdOrder);
    }

    // In-memory fallback deduction
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      let linkIds: string[] = [];
      if (Array.isArray(item.inventoryLinkIds) && item.inventoryLinkIds.length > 0) {
        linkIds = item.inventoryLinkIds;
      } else if (item.inventoryLinkId) {
        linkIds = [item.inventoryLinkId];
      } else {
        const prod = memoryStore.products.find(p => p.id === (Number(item.id) || item.id));
        if (prod) {
          if (Array.isArray(prod.inventoryLinkIds) && prod.inventoryLinkIds.length > 0) {
            linkIds = prod.inventoryLinkIds;
          } else if (prod.inventoryLinkId) {
            linkIds = [prod.inventoryLinkId];
          }
        }
      }

      if (linkIds.length > 0) {
        for (const invId of linkIds) {
          const invItem = memoryStore.inventory.find(i => i.id === invId);
          if (invItem) {
            const prevQty = invItem.quantity;
            invItem.quantity = Math.max(0, invItem.quantity - qty);
            const threshold = invItem.lowStockThreshold || 10;
            if (invItem.quantity <= threshold && prevQty > threshold) {
              invItem.lowStockAcknowledged = false;
            }
            memoryStore.inventoryLogs.push({
              id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              inventoryItemId: invId,
              inventoryItemName: invItem.name,
              type: 'order-deduction',
              quantity: -qty,
              remainingQuantity: invItem.quantity,
              notes: `Auto-deducted for Order ${orderId}`,
              performer: performerEmail,
              timestamp: new Date().toISOString()
            });
          }
        }
      } else {
        const prod = memoryStore.products.find(p => p.id === (Number(item.id) || item.id));
        if (prod) {
          prod.stock = Math.max(0, (prod.stock || 0) - qty);
        }
      }
    }

    memoryStore.orders.push(orderDoc);
    return res.status(201).json(orderDoc);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// 6. PATCH /api/orders/:id/status - Update order status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = (Array.isArray(rawId) ? rawId[0] : rawId) || '';
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const { isConnected } = await getDbStatus();

    if (isConnected) {
      const order = await Order.findOne({ id });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Safeguard: A cancelled order must not be able to proceed to Processing, Cooking, Ready for Pickup, or Completed
      if (order.status === 'Cancelled' && status !== 'Cancelled') {
        return res.status(400).json({ error: 'This order has been cancelled and cannot proceed to any other status.' });
      }

      const previousStatus = order.status;
      order.status = status;
      if (status === 'Paid' || status === 'Completed') {
        order.paymentStatus = 'Paid';
      } else if (status === 'Cancelled') {
        order.paymentStatus = 'Cancelled';
      }

      // Auto-restock inventory/products if cancelling an active order
      if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
        const performerEmail = getUserEmail(req) || 'system';
        if (Array.isArray(order.items)) {
          for (const item of order.items) {
            const qty = Number(item.quantity) || 1;
            let linkIds: string[] = [];
            if (Array.isArray(item.inventoryLinkIds) && item.inventoryLinkIds.length > 0) {
              linkIds = item.inventoryLinkIds;
            } else if (item.inventoryLinkId) {
              linkIds = [item.inventoryLinkId];
            } else {
              const numId = Number(item.id);
              const prod = !isNaN(numId) ? await Product.findOne({ id: numId }) : null;
              if (prod) {
                if (Array.isArray(prod.inventoryLinkIds) && prod.inventoryLinkIds.length > 0) {
                  linkIds = prod.inventoryLinkIds;
                } else if (prod.inventoryLinkId) {
                  linkIds = [prod.inventoryLinkId];
                }
              }
            }

            if (linkIds.length > 0) {
              for (const invId of linkIds) {
                const invItem = await InventoryItem.findOne({ id: invId });
                if (invItem) {
                  invItem.quantity = (invItem.quantity || 0) + qty;
                  await invItem.save();

                  await InventoryLog.create({
                    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    inventoryId: invId,
                    itemName: invItem.name,
                    type: 'order-cancellation-restock',
                    quantityChange: qty,
                    remainingQuantity: invItem.quantity,
                    reason: `Restocked from Cancelled Order ${id}`,
                    orderId: id,
                    performedBy: performerEmail,
                    date: new Date()
                  }).catch(() => {});
                }
              }
            } else {
              const numId = Number(item.id);
              const prod = !isNaN(numId) ? await Product.findOne({ id: numId }) : null;
              if (prod) {
                prod.stock = (prod.stock || 0) + qty;
                await prod.save();
              }
            }
          }
        }
      }

      await order.save();

      // Only send notification when the corresponding status button is actually clicked and the status successfully changes
      if (previousStatus !== status) {
        let orderWithEmail: any = order.toObject ? order.toObject() : { ...order };
        const hasDirectEmail = (order.customer?.email && order.customer.email.includes('@')) || (order.userEmail && order.userEmail.includes('@'));
        if (!hasDirectEmail) {
          try {
            const registeredUser = await User.findOne({
              $or: [
                { name: order.customer?.name },
                { name: order.userName },
                { phone: order.customer?.phone }
              ]
            }).lean();
            if (registeredUser?.email) {
              orderWithEmail.userEmail = registeredUser.email;
            }
          } catch (userLookupErr) {
            console.warn('[Order Status] User email lookup failed:', userLookupErr);
          }
        }

        if (status === 'Processing') {
          // 1. Process Order / Processing:
          // When admin clicks Process Order and status changes to Processing,
          // send email telling customer order is confirmed and is being processed.
          sendOrderStatusEmail(orderWithEmail, 'Processing').catch(err => {
            console.error(`[Order Email] Error sending Processing email for order ${id}:`, err);
          });
        } else if (status === 'Ready for Pickup' || status === 'Ready to Pickup') {
          // 3. Ready for Pickup:
          // When admin clicks Ready for Pickup and status changes to Ready for Pickup,
          // send email telling customer order is ready for pickup.
          sendOrderStatusEmail(orderWithEmail, 'Ready for Pickup').catch(err => {
            console.error(`[Order Email] Error sending Ready for Pickup email for order ${id}:`, err);
          });
        }
        // 2. Cooking:
        // When changed from Processing -> Cooking, DO NOT send an email.
        // Status updates normally and is visible in order-status system without emailing.
      }

      return res.json(order);
    }

    const orderIdx = memoryStore.orders.findIndex(o => o.id === id);
    if (orderIdx === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (memoryStore.orders[orderIdx].status === 'Cancelled' && status !== 'Cancelled') {
      return res.status(400).json({ error: 'This order has been cancelled and cannot proceed to any other status.' });
    }

    const previousStatus = memoryStore.orders[orderIdx].status;
    memoryStore.orders[orderIdx].status = status;
    if (status === 'Paid' || status === 'Completed') {
      memoryStore.orders[orderIdx].paymentStatus = 'Paid';
    } else if (status === 'Cancelled') {
      memoryStore.orders[orderIdx].paymentStatus = 'Cancelled';
    }

    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      const targetOrder = memoryStore.orders[orderIdx];
      if (Array.isArray(targetOrder.items)) {
        for (const item of targetOrder.items) {
          const qty = Number(item.quantity) || 1;
          let linkIds: string[] = [];
          if (Array.isArray(item.inventoryLinkIds) && item.inventoryLinkIds.length > 0) {
            linkIds = item.inventoryLinkIds;
          } else if (item.inventoryLinkId) {
            linkIds = [item.inventoryLinkId];
          } else {
            const prod = memoryStore.products.find(p => p.id === (Number(item.id) || item.id));
            if (prod) {
              if (Array.isArray(prod.inventoryLinkIds) && prod.inventoryLinkIds.length > 0) {
                linkIds = prod.inventoryLinkIds;
              } else if (prod.inventoryLinkId) {
                linkIds = [prod.inventoryLinkId];
              }
            }
          }

          if (linkIds.length > 0) {
            for (const invId of linkIds) {
              const invItem = memoryStore.inventory.find(i => i.id === invId);
              if (invItem) {
                invItem.quantity = (invItem.quantity || 0) + qty;
              }
            }
          } else {
            const prod = memoryStore.products.find(p => p.id === (Number(item.id) || item.id));
            if (prod) {
              prod.stock = (prod.stock || 0) + qty;
            }
          }
        }
      }
    }

    const updatedOrder = memoryStore.orders[orderIdx];

    if (previousStatus !== status) {
      let orderWithEmail = { ...updatedOrder };
      const hasDirectEmail = (updatedOrder.customer?.email && updatedOrder.customer.email.includes('@')) || (updatedOrder.userEmail && updatedOrder.userEmail.includes('@'));
      if (!hasDirectEmail) {
        const registeredUser = memoryStore.users.find(u => 
          (updatedOrder.customer?.name && u.name === updatedOrder.customer.name) ||
          (updatedOrder.userName && u.name === updatedOrder.userName) ||
          (updatedOrder.customer?.phone && (u as any).phone === updatedOrder.customer.phone)
        );
        if (registeredUser?.email) {
          orderWithEmail.userEmail = registeredUser.email;
        }
      }

      if (status === 'Processing') {
        sendOrderStatusEmail(orderWithEmail, 'Processing').catch(err => {
          console.error(`[Order Email] Error sending Processing email for order ${id}:`, err);
        });
      } else if (status === 'Ready for Pickup' || status === 'Ready to Pickup') {
        sendOrderStatusEmail(orderWithEmail, 'Ready for Pickup').catch(err => {
          console.error(`[Order Email] Error sending Ready for Pickup email for order ${id}:`, err);
        });
      }
    }

    return res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// 7. PATCH /api/orders/:id/payment - Update payment details / screenshot
router.patch('/:id/payment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentScreenshot, paymentStatus, paymentMethod, amountPaid, change } = req.body;

    const { isConnected } = await getDbStatus();

    if (isConnected) {
      const order = await Order.findOne({ id });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status === 'Cancelled') {
        return res.status(400).json({ error: 'Payment cannot be confirmed or updated for a cancelled order.' });
      }

      if (paymentScreenshot !== undefined) order.paymentScreenshot = paymentScreenshot;
      if (paymentStatus) order.paymentStatus = paymentStatus;
      if (paymentMethod) order.paymentMethod = paymentMethod;
      if (amountPaid !== undefined) order.amountPaid = Number(amountPaid);
      if (change !== undefined) order.change = Number(change);

      await order.save();
      return res.json(order);
    }

    const orderIdx = memoryStore.orders.findIndex(o => o.id === id);
    if (orderIdx === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (memoryStore.orders[orderIdx].status === 'Cancelled') {
      return res.status(400).json({ error: 'Payment cannot be confirmed or updated for a cancelled order.' });
    }

    if (paymentScreenshot !== undefined) memoryStore.orders[orderIdx].paymentScreenshot = paymentScreenshot;
    if (paymentStatus) memoryStore.orders[orderIdx].paymentStatus = paymentStatus;
    if (paymentMethod) memoryStore.orders[orderIdx].paymentMethod = paymentMethod;
    if (amountPaid !== undefined) memoryStore.orders[orderIdx].amountPaid = Number(amountPaid);
    if (change !== undefined) memoryStore.orders[orderIdx].change = Number(change);

    return res.json(memoryStore.orders[orderIdx]);
  } catch (error) {
    console.error('Error updating order payment:', error);
    res.status(500).json({ error: 'Failed to update order payment' });
  }
});

// 8. DELETE /api/orders/:id - Safeguard order history (deletion forbidden)
router.delete('/:id', async (req: Request, res: Response) => {
  return res.status(403).json({ 
    error: 'Order history records cannot be deleted to maintain store audit compliance. Please update the order status to Cancelled if needed.' 
  });
});

export default router;
