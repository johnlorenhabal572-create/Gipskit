import { Router, Request, Response } from 'express';
import { Order, Product, InventoryItem, InventoryLog, User } from '../models';
import { getDbStatus, memoryStore } from '../db';
import { authenticateToken, requireAdminOrStaff } from '../auth';

const router = Router();

// Helper: auth verification
function getUserRole(req: Request): string {
  return (req.headers['x-user-role'] as string) || '';
}

function getUserEmail(req: Request): string {
  return (req.headers['x-user-email'] as string) || '';
}

// Normalizes order email so customer.email is consistently set for registered users
function normalizeOrderEmail(order: any): any {
  if (!order) return order;
  const rawCustomerEmail = (order.customer?.email || '').trim();
  const rawUserEmail = (order.userEmail || '').trim();
  
  const validEmail = (rawCustomerEmail && rawCustomerEmail !== 'anonymous')
    ? rawCustomerEmail
    : ((rawUserEmail && rawUserEmail !== 'anonymous') ? rawUserEmail : '');

  return {
    ...order,
    customer: {
      ...order.customer,
      email: validEmail || ''
    },
    userEmail: validEmail || (rawUserEmail !== 'anonymous' ? rawUserEmail : '')
  };
}

let hasBackfilledOrders = false;
export async function backfillExistingOrderEmails() {
  if (hasBackfilledOrders) return;
  hasBackfilledOrders = true;
  try {
    const { isConnected } = await getDbStatus();
    if (!isConnected) {
      hasBackfilledOrders = false;
      return;
    }
    const candidates = await Order.find({
      $or: [
        { 'customer.email': '' },
        { 'customer.email': null },
        { 'customer.email': { $exists: false } }
      ],
      userEmail: { $exists: true, $ne: '', $nin: ['anonymous', 'system'] }
    }).select('id userEmail customer').lean();

    if (candidates.length > 0) {
      const bulkOps = candidates
        .filter(c => c.userEmail && c.userEmail.includes('@'))
        .map(c => ({
          updateOne: {
            filter: { id: c.id },
            update: { $set: { 'customer.email': c.userEmail.trim() } }
          }
        }));
      if (bulkOps.length > 0) {
        await Order.bulkWrite(bulkOps);
      }
    }
  } catch (err) {
    console.warn('Backfill existing order emails check:', err);
  }
}

// Maintenance endpoint: trigger order email backfill separately from normal read operations
router.post('/maintenance/backfill-emails', async (req: Request, res: Response) => {
  try {
    hasBackfilledOrders = false;
    await backfillExistingOrderEmails();
    return res.json({ success: true, message: 'Order email backfill completed' });
  } catch (error) {
    console.error('Error running manual backfill:', error);
    return res.status(500).json({ error: 'Failed to run order email backfill' });
  }
});

// Run maintenance backfill once in background after server warmup (never blocks GET requests)
setTimeout(() => {
  backfillExistingOrderEmails().catch(() => {});
}, 10000);

// 1. GET /api/orders - Get orders (scoped to authenticated customer or full access for admin/staff)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;
    const isPrivileged = currentUser.role === 'admin' || currentUser.role === 'staff';
    const { isConnected } = await getDbStatus();
    const { status, email, orderType, search, orderIds, limit, scope } = req.query;

    const emailStr = typeof email === 'string' ? email.trim() : '';
    const idList = orderIds ? String(orderIds).split(',').map(s => s.trim()).filter(Boolean) : [];

    if (isConnected) {
      const query: any = {};
      const andConditions: any[] = [];

      if (!isPrivileged) {
        // Strict Customer Isolation: Customer MUST only retrieve their own orders.
        // Ignore any client-supplied email or orderIds parameters meant to widen access.
        andConditions.push({
          $or: [
            { userEmail: currentUser.email },
            { 'customer.email': currentUser.email }
          ]
        });
      } else {
        // Admin / Staff access: support existing search/filter parameters
        if (emailStr && idList.length > 0) {
          andConditions.push({
            $or: [{ userEmail: emailStr }, { 'customer.email': emailStr }, { id: { $in: idList } }]
          });
        } else if (emailStr) {
          andConditions.push({
            $or: [{ userEmail: emailStr }, { 'customer.email': emailStr }]
          });
        } else if (idList.length > 0) {
          query.id = { $in: idList };
        }
      }

      if (scope === 'manage') {
        const manageStatuses = ['Paid', 'Processing', 'Cooking', 'Ready for Pickup', 'Ready to Pickup'];
        if (status && status !== 'All') {
          if (manageStatuses.includes(status as string)) {
            query.status = status;
          } else {
            query.status = { $in: [] };
          }
        } else {
          query.status = { $in: manageStatuses };
        }
      } else if (scope === 'history') {
        if (status && status !== 'All') {
          if (status === 'Completed') {
            query.status = 'Completed';
          } else if (status === 'Cancelled') {
            query.status = 'Cancelled';
            query.cancelledBy = { $in: ['admin', 'staff'] };
          } else {
            query.status = { $in: [] };
          }
        } else {
          andConditions.push({
            $or: [
              { status: 'Completed' },
              { status: 'Cancelled', cancelledBy: { $in: ['admin', 'staff'] } }
            ]
          });
        }
      } else {
        if (status && status !== 'All') {
          query.status = status;
        }
      }

      if (orderType) {
        query.orderType = orderType;
      }
      if (search && typeof search === 'string') {
        const searchRegex = new RegExp(search.trim(), 'i');
        const searchConditions: any[] = [
          { id: searchRegex },
          { 'customer.name': searchRegex },
          { 'customer.phone': searchRegex }
        ];
        if (isPrivileged) {
          searchConditions.push({ 'customer.email': searchRegex }, { userEmail: searchRegex });
        }
        andConditions.push({ $or: searchConditions });
      }

      if (andConditions.length === 1) {
        Object.assign(query, andConditions[0]);
      } else if (andConditions.length > 1) {
        query.$and = andConditions;
      }

      let orderQuery = Order.find(query).sort({ createdAt: -1 });
      if (limit) {
        const parsedLimit = Math.max(1, Number(limit));
        if (!isNaN(parsedLimit)) {
          orderQuery = orderQuery.limit(parsedLimit);
        }
      }

      const orders = await orderQuery.lean();
      return res.json(orders.map(normalizeOrderEmail));
    }

    // In-memory fallback
    let list = [...memoryStore.orders];

    if (!isPrivileged) {
      const customerEmail = currentUser.email.toLowerCase();
      list = list.filter(o => 
        (o.userEmail || '').toLowerCase() === customerEmail || 
        (o.customer?.email || '').toLowerCase() === customerEmail
      );
    } else {
      if (emailStr && idList.length > 0) {
        list = list.filter(o => o.userEmail === emailStr || o.customer?.email === emailStr || idList.includes(o.id));
      } else if (emailStr) {
        list = list.filter(o => o.userEmail === emailStr || o.customer?.email === emailStr);
      } else if (idList.length > 0) {
        list = list.filter(o => idList.includes(o.id));
      }
    }

    if (scope === 'manage') {
      const manageStatuses = ['Paid', 'Processing', 'Cooking', 'Ready for Pickup', 'Ready to Pickup'];
      list = list.filter(o => manageStatuses.includes(o.status));
      if (status && status !== 'All') {
        list = list.filter(o => o.status === status);
      }
    } else if (scope === 'history') {
      list = list.filter(o => 
        o.status === 'Completed' || 
        (o.status === 'Cancelled' && (o.cancelledBy === 'admin' || o.cancelledBy === 'staff'))
      );
      if (status && status !== 'All') {
        list = list.filter(o => o.status === status);
      }
    } else {
      if (status && status !== 'All') {
        list = list.filter(o => o.status === status);
      }
    }
    if (orderType) {
      list = list.filter(o => o.orderType === orderType);
    }
    if (search && typeof search === 'string') {
      const s = search.toLowerCase();
      list = list.filter(o => 
        o.id?.toLowerCase().includes(s) || 
        o.customer?.name?.toLowerCase().includes(s) ||
        (isPrivileged && (o.customer?.email?.toLowerCase().includes(s) || o.userEmail?.toLowerCase().includes(s))) ||
        o.customer?.phone?.toLowerCase().includes(s)
      );
    }

    list.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    if (limit) {
      const parsedLimit = Math.max(1, Number(limit));
      if (!isNaN(parsedLimit)) {
        list = list.slice(0, parsedLimit);
      }
    }
    return res.json(list.map(normalizeOrderEmail));
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// 2. GET /api/orders/stats/summary - Comprehensive sales statistics (Admin/Staff only)
router.get('/stats/summary', authenticateToken, requireAdminOrStaff, async (req: Request, res: Response) => {
  try {
    const { isConnected } = await getDbStatus();
    const { period, date } = req.query; // period: 'day' | 'week' | 'month' | 'year' | 'all'
    const targetDate = date ? new Date(date as string) : new Date();

    if (isConnected) {
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (period === 'day') {
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
      } else if (period === 'week') {
        startDate = new Date(targetDate);
        startDate.setDate(targetDate.getDate() - targetDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
      } else if (period === 'month') {
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1, 0, 0, 0, 0);
      } else if (period === 'year') {
        startDate = new Date(targetDate.getFullYear(), 0, 1, 0, 0, 0, 0);
        endDate = new Date(targetDate.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
      }

      const matchStage: any = { status: 'Completed' };
      if (startDate && endDate) {
        matchStage.$or = [
          { date: { $gte: startDate, $lt: endDate } },
          { date: { $exists: false }, createdAt: { $gte: startDate, $lt: endDate } }
        ];
      }

      const [aggResult, filteredOrders] = await Promise.all([
        Order.aggregate([
          { $match: matchStage },
          {
            $facet: {
              totals: [
                {
                  $group: {
                    _id: null,
                    totalRevenue: { $sum: { $ifNull: ['$total', 0] } },
                    transactionCount: { $sum: 1 }
                  }
                }
              ],
              paymentMethods: [
                {
                  $group: {
                    _id: { $ifNull: ['$paymentMethod', 'Cash'] },
                    amount: { $sum: { $ifNull: ['$total', 0] } }
                  }
                }
              ]
            }
          }
        ]),
        Order.find(matchStage).sort({ createdAt: -1 }).lean()
      ]);

      const stats = aggResult?.[0];
      const totalRevenue = stats?.totals?.[0]?.totalRevenue || 0;
      const transactionCount = stats?.totals?.[0]?.transactionCount || 0;
      const averageOrderValue = transactionCount > 0 ? Math.round(totalRevenue / transactionCount) : 0;

      const paymentMethods: { [key: string]: number } = {};
      (stats?.paymentMethods || []).forEach((pm: any) => {
        paymentMethods[pm._id || 'Cash'] = pm.amount || 0;
      });

      return res.json({
        period: period || 'all',
        totalRevenue,
        transactionCount,
        averageOrderValue,
        paymentMethods,
        orders: filteredOrders.map(normalizeOrderEmail)
      });
    }

    // In-memory fallback
    const orders = memoryStore.orders.filter(o => o.status === 'Completed');
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
      orders: filtered.map(normalizeOrderEmail)
    });
  } catch (error) {
    console.error('Error calculating sales summary:', error);
    res.status(500).json({ error: 'Failed to calculate sales summary' });
  }
});

// 3. GET /api/orders/stats/product-analysis - Best & least selling items (Admin/Staff only)
router.get('/stats/product-analysis', authenticateToken, requireAdminOrStaff, async (req: Request, res: Response) => {
  try {
    const { isConnected } = await getDbStatus();

    if (isConnected) {
      const aggregatedProducts = await Order.aggregate([
        { $match: { status: 'Completed' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: { $ifNull: ['$items.name', 'Unknown Item'] },
            name: { $first: { $ifNull: ['$items.name', 'Unknown Item'] } },
            quantity: { $sum: { $ifNull: ['$items.quantity', 0] } },
            revenue: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$items.price', 0] },
                  { $ifNull: ['$items.quantity', 0] }
                ]
              }
            },
            category: { $first: { $ifNull: ['$items.category', ''] } }
          }
        },
        {
          $project: {
            _id: 0,
            name: 1,
            quantity: 1,
            revenue: 1,
            category: 1
          }
        }
      ]);

      const productList = aggregatedProducts.map(p => ({
        name: p.name || 'Unknown Item',
        quantity: Number(p.quantity) || 0,
        revenue: Number(p.revenue) || 0,
        category: p.category || ''
      }));

      const bestSelling = [...productList].sort((a, b) => b.quantity - a.quantity);
      const leastSelling = [...productList].sort((a, b) => a.quantity - b.quantity);

      return res.json({
        allProducts: productList,
        bestSelling: bestSelling.slice(0, 10),
        leastSelling: leastSelling.slice(0, 10),
        totalProductsTracked: productList.length
      });
    }

    // In-memory fallback
    const orders = memoryStore.orders.filter(o => o.status === 'Completed');
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

// 4. GET /api/orders/:id - Single order (scoped to owner customer or admin/staff)
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isConnected } = await getDbStatus();
    const currentUser = req.user!;
    const isPrivileged = currentUser.role === 'admin' || currentUser.role === 'staff';

    let order: any = null;
    if (isConnected) {
      order = await Order.findOne({ id }).lean();
    } else {
      order = memoryStore.orders.find(o => o.id === id);
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Customer ownership verification: customer can ONLY access their own orders
    if (!isPrivileged) {
      const customerEmail = currentUser.email.toLowerCase();
      const orderUserEmail = (order.userEmail || '').toLowerCase();
      const orderCustEmail = (order.customer?.email || '').toLowerCase();
      if (orderUserEmail !== customerEmail && orderCustEmail !== customerEmail) {
        return res.status(403).json({ error: 'Access denied: You are not authorized to view this order.' });
      }
    }

    return res.json(normalizeOrderEmail(order));
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// 5. POST /api/orders - Create and process order + auto-deduct inventory
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;
    const isPrivileged = currentUser.role === 'admin' || currentUser.role === 'staff';
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

    // Strict validation for Online / Customer orders (POS orders bypass this to support walk-in flexibility)
    if (finalOrderType !== 'POS') {
      const rawName = (customer?.name || userName || '').trim();
      if (!rawName) {
        return res.status(400).json({ error: 'Customer Full Name is required.' });
      }
      if (rawName.length > 50) {
        return res.status(400).json({ error: 'Customer Full Name cannot exceed 50 characters.' });
      }
      if (/[0-9]/.test(rawName)) {
        return res.status(400).json({ error: 'Customer Full Name must not contain numbers.' });
      }

      const rawPhone = (customer?.phone || '').trim();
      if (!rawPhone) {
        return res.status(400).json({ error: 'Customer Phone Number is required.' });
      }
      if (!/^\d{11}$/.test(rawPhone)) {
        return res.status(400).json({ error: 'Customer Phone Number must contain exactly 11 digits.' });
      }
    }

    // Customer email MUST come from verified token for customer orders
    let resolvedEmail = '';
    if (!isPrivileged) {
      resolvedEmail = currentUser.email;
    } else {
      resolvedEmail = (customer?.email && customer.email !== 'anonymous' ? customer.email.trim() : '') ||
                      (userEmail && userEmail !== 'anonymous' ? userEmail.trim() : '') ||
                      currentUser.email;
    }

    const performerEmail = currentUser.email || 'system';

    const resolvedCustomerName = finalOrderType !== 'POS'
      ? (customer?.name || userName || '').trim()
      : (customer?.name || userName || (!isPrivileged ? 'Valued Customer' : 'Walk-in Customer'));
    const resolvedPhone = finalOrderType !== 'POS'
      ? (customer?.phone || '').trim()
      : (customer?.phone || '');

    const orderDoc = {
      id: orderId,
      customer: {
        name: resolvedCustomerName,
        email: resolvedEmail,
        phone: resolvedPhone,
        address: customer?.address || '',
        facebook: customer?.facebook || ''
      },
      userEmail: resolvedEmail,
      userName: resolvedCustomerName,
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
        const numId = Number(item.id);
        let prod: any = null;
        if (!isNaN(numId)) {
          prod = await Product.findOne({ id: numId });
        } else if (item.id) {
          prod = await Product.findOne({ id: item.id });
        }

        // Check if item or product has configured ingredients
        const configuredIngredients = (Array.isArray(item.ingredients) && item.ingredients.length > 0)
          ? item.ingredients
          : (prod && Array.isArray(prod.ingredients) && prod.ingredients.length > 0)
            ? prod.ingredients
            : null;

        if (configuredIngredients && configuredIngredients.length > 0) {
          // Deduct from each configured ingredient using its specific deductionQty * ordered quantity
          for (const ing of configuredIngredients) {
            const invId = String(ing.inventoryId);
            const deductionRate = Number(ing.deductionQty);
            if (!invId || isNaN(deductionRate) || deductionRate <= 0) continue;

            const totalDeduction = Number((deductionRate * qty).toFixed(6));
            const invItem = await InventoryItem.findOne({ id: invId });
            if (invItem) {
              const prevQty = Number(invItem.quantity) || 0;
              const newQty = Math.max(0, Number((prevQty - totalDeduction).toFixed(6)));
              invItem.quantity = newQty;
              const threshold = invItem.lowStockThreshold || 10;
              if (newQty <= threshold && prevQty > threshold) {
                invItem.lowStockAcknowledged = false;
              }
              await invItem.save();

              // Log the order deduction with actual quantity deducted
              await InventoryLog.create({
                id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                inventoryId: invId,
                itemName: invItem.name,
                type: 'order-deduction',
                quantityChange: -totalDeduction,
                remainingQuantity: newQty,
                reason: `Auto-deducted for Order ${orderId}`,
                orderId,
                performedBy: performerEmail,
                date: new Date()
              });
            }
          }
        } else {
          // Legacy product deduction: use inventoryLinkIds / inventoryLinkId
          let linkIds: string[] = [];
          if (Array.isArray(item.inventoryLinkIds) && item.inventoryLinkIds.length > 0) {
            linkIds = item.inventoryLinkIds;
          } else if (item.inventoryLinkId) {
            linkIds = [item.inventoryLinkId];
          } else if (prod) {
            if (Array.isArray(prod.inventoryLinkIds) && prod.inventoryLinkIds.length > 0) {
              linkIds = prod.inventoryLinkIds;
            } else if (prod.inventoryLinkId) {
              linkIds = [prod.inventoryLinkId];
            }
          }

          if (linkIds.length > 0) {
            // Deduct from all linked InventoryItems (1 each per ordered quantity)
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
          } else if (prod) {
            // Manual product stock deduction
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
      const prod = memoryStore.products.find(p => p.id === (Number(item.id) || item.id) || String(p.id) === String(item.id));

      const configuredIngredients = (Array.isArray(item.ingredients) && item.ingredients.length > 0)
        ? item.ingredients
        : (prod && Array.isArray((prod as any).ingredients) && (prod as any).ingredients.length > 0)
          ? (prod as any).ingredients
          : null;

      if (configuredIngredients && configuredIngredients.length > 0) {
        // Deduct from each configured ingredient using its specific deductionQty * ordered quantity
        for (const ing of configuredIngredients) {
          const invId = String(ing.inventoryId);
          const deductionRate = Number(ing.deductionQty);
          if (!invId || isNaN(deductionRate) || deductionRate <= 0) continue;

          const totalDeduction = Number((deductionRate * qty).toFixed(6));
          const invItem = memoryStore.inventory.find(i => i.id === invId);
          if (invItem) {
            const prevQty = Number(invItem.quantity) || 0;
            const newQty = Math.max(0, Number((prevQty - totalDeduction).toFixed(6)));
            invItem.quantity = newQty;
            const threshold = invItem.lowStockThreshold || 10;
            if (newQty <= threshold && prevQty > threshold) {
              invItem.lowStockAcknowledged = false;
            }
            memoryStore.inventoryLogs.push({
              id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              inventoryId: invId,
              inventoryItemId: invId,
              itemName: invItem.name,
              inventoryItemName: invItem.name,
              type: 'order-deduction',
              quantityChange: -totalDeduction,
              quantity: -totalDeduction,
              remainingQuantity: newQty,
              reason: `Auto-deducted for Order ${orderId}`,
              notes: `Auto-deducted for Order ${orderId}`,
              orderId,
              performer: performerEmail,
              performedBy: performerEmail,
              date: new Date(),
              timestamp: new Date().toISOString()
            });
          }
        }
      } else {
        // Legacy product deduction
        let linkIds: string[] = [];
        if (Array.isArray(item.inventoryLinkIds) && item.inventoryLinkIds.length > 0) {
          linkIds = item.inventoryLinkIds;
        } else if (item.inventoryLinkId) {
          linkIds = [item.inventoryLinkId];
        } else if (prod) {
          if (Array.isArray(prod.inventoryLinkIds) && prod.inventoryLinkIds.length > 0) {
            linkIds = prod.inventoryLinkIds;
          } else if (prod.inventoryLinkId) {
            linkIds = [prod.inventoryLinkId];
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
                inventoryId: invId,
                inventoryItemId: invId,
                itemName: invItem.name,
                inventoryItemName: invItem.name,
                type: 'order-deduction',
                quantityChange: -qty,
                quantity: -qty,
                remainingQuantity: invItem.quantity,
                reason: `Auto-deducted for Order ${orderId}`,
                notes: `Auto-deducted for Order ${orderId}`,
                orderId,
                performer: performerEmail,
                performedBy: performerEmail,
                date: new Date(),
                timestamp: new Date().toISOString()
              });
            }
          }
        } else if (prod) {
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
router.patch('/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = (Array.isArray(rawId) ? rawId[0] : rawId) || '';
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const currentUser = req.user!;
    const isPrivileged = currentUser.role === 'admin' || currentUser.role === 'staff';
    const { isConnected } = await getDbStatus();

    if (isConnected) {
      const order = await Order.findOne({ id });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Customer authorization check: customers may only confirm payment or cancel their own pending orders
      if (!isPrivileged) {
        const customerEmail = currentUser.email.toLowerCase();
        const orderUserEmail = (order.userEmail || '').toLowerCase();
        const orderCustEmail = (order.customer?.email || '').toLowerCase();
        if (orderUserEmail !== customerEmail && orderCustEmail !== customerEmail) {
          return res.status(403).json({ error: 'Access denied: You are not authorized to modify this order.' });
        }
        if (status !== 'Cancelled' && status !== 'Paid') {
          return res.status(403).json({ error: 'Customers are only permitted to confirm payment or cancel pending orders.' });
        }
        if (order.status !== 'Pending') {
          return res.status(400).json({ error: 'Only pending orders can be updated by customer.' });
        }
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
        if (currentUser.role === 'customer') {
          order.cancelledBy = 'customer';
        } else if (currentUser.role === 'admin') {
          order.cancelledBy = 'admin';
        } else if (currentUser.role === 'staff') {
          order.cancelledBy = 'staff';
        }
      }

      // When an ONLINE order transitions to database status 'Paid':
      // set adminViewed = false and reset adminViewedAt so the payment becomes a new admin notification
      if (status === 'Paid' && order.orderType === 'Online') {
        order.adminViewed = false;
        order.adminViewedAt = null;
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

      return res.json(order);
    }

    const orderIdx = memoryStore.orders.findIndex(o => o.id === id);
    if (orderIdx === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!isPrivileged) {
      const targetOrder = memoryStore.orders[orderIdx];
      const customerEmail = currentUser.email.toLowerCase();
      const orderUserEmail = (targetOrder.userEmail || '').toLowerCase();
      const orderCustEmail = (targetOrder.customer?.email || '').toLowerCase();
      if (orderUserEmail !== customerEmail && orderCustEmail !== customerEmail) {
        return res.status(403).json({ error: 'Access denied: You are not authorized to modify this order.' });
      }
      if (status !== 'Cancelled' && status !== 'Paid') {
        return res.status(403).json({ error: 'Customers are only permitted to confirm payment or cancel pending orders.' });
      }
      if (targetOrder.status !== 'Pending') {
        return res.status(400).json({ error: 'Only pending orders can be updated by customer.' });
      }
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
      if (currentUser.role === 'customer') {
        memoryStore.orders[orderIdx].cancelledBy = 'customer';
      } else if (currentUser.role === 'admin') {
        memoryStore.orders[orderIdx].cancelledBy = 'admin';
      } else if (currentUser.role === 'staff') {
        memoryStore.orders[orderIdx].cancelledBy = 'staff';
      }
    }

    // When an ONLINE order transitions to database status 'Paid':
    // set adminViewed = false and reset adminViewedAt so the payment becomes a new admin notification
    if (status === 'Paid' && memoryStore.orders[orderIdx].orderType === 'Online') {
      memoryStore.orders[orderIdx].adminViewed = false;
      memoryStore.orders[orderIdx].adminViewedAt = null;
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

    return res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// 7. PATCH /api/orders/:id/payment - Update payment details / screenshot
router.patch('/:id/payment', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentScreenshot, paymentStatus, paymentMethod, amountPaid, change } = req.body;
    const currentUser = req.user!;
    const isPrivileged = currentUser.role === 'admin' || currentUser.role === 'staff';

    // Validate paymentScreenshot before processing or saving
    if (paymentScreenshot !== undefined) {
      const isString = typeof paymentScreenshot === 'string';
      const allowedPrefixes = [
        'data:image/jpeg;base64,',
        'data:image/png;base64,',
        'data:image/webp;base64,'
      ];

      const matchedPrefix = isString ? allowedPrefixes.find(p => paymentScreenshot.startsWith(p)) : null;

      // Enforce reasonable maximum paymentScreenshot string size (approx 2 MB encoded payload)
      const MAX_SCREENSHOT_LENGTH = 2.5 * 1024 * 1024;
      const isValidLength = isString && paymentScreenshot.length > 0 && paymentScreenshot.length <= MAX_SCREENSHOT_LENGTH;

      // Validate base64 payload integrity
      let isValidBase64 = false;
      if (isString && matchedPrefix && isValidLength) {
        const base64Data = paymentScreenshot.slice(matchedPrefix.length).trim();
        const base64Regex = /^[A-Za-z0-9+/=]+$/;
        isValidBase64 = base64Data.length >= 32 && base64Regex.test(base64Data);
      }

      if (!isString || !matchedPrefix || !isValidLength || !isValidBase64) {
        return res.status(400).json({
          error: "Payment receipt must be a valid image (JPEG, PNG, or WebP) and must not exceed the allowed size."
        });
      }
    }

    const { isConnected } = await getDbStatus();

    if (isConnected) {
      const order = await Order.findOne({ id });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Customer authorization check: customers can ONLY update payment for their own order
      if (!isPrivileged) {
        const customerEmail = currentUser.email.toLowerCase();
        const orderUserEmail = (order.userEmail || '').toLowerCase();
        const orderCustEmail = (order.customer?.email || '').toLowerCase();
        if (orderUserEmail !== customerEmail && orderCustEmail !== customerEmail) {
          return res.status(403).json({ error: 'Access denied: You are not authorized to update payment for this order.' });
        }
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

    if (!isPrivileged) {
      const targetOrder = memoryStore.orders[orderIdx];
      const customerEmail = currentUser.email.toLowerCase();
      const orderUserEmail = (targetOrder.userEmail || '').toLowerCase();
      const orderCustEmail = (targetOrder.customer?.email || '').toLowerCase();
      if (orderUserEmail !== customerEmail && orderCustEmail !== customerEmail) {
        return res.status(403).json({ error: 'Access denied: You are not authorized to update payment for this order.' });
      }
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
