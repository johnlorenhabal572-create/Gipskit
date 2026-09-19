import { useState, useEffect, useMemo } from 'react';
import { fetchOrders, fetchProductAnalysis } from '../api/orderService';
import { fetchProducts } from '../api/productService';
import { formatPrice } from '../utils/format';
import { 
  Calendar, TrendingUp, ShoppingBag, DollarSign, ChevronLeft, ChevronRight,
  BarChart2, Award, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

const SalesReport = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [menuProducts, setMenuProducts] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'transactions' | 'product-analysis'>('transactions');

  const loadData = async () => {
    try {
      const [orderList, productList] = await Promise.all([
        fetchOrders({ status: 'Completed' }),
        fetchProducts(),
        fetchProductAnalysis()
      ]);
      setOrders(orderList || []);
      setMenuProducts(productList || []);
    } catch (err) {
      console.error('Failed to load sales report data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter orders based on the selected period
  const filteredOrders = orders.filter(order => {
    if (order.status !== 'Completed') return false;
    
    const orderDate = new Date(order.date || order.createdAt);
    const isSameYear = orderDate.getFullYear() === selectedDate.getFullYear();
    const isSameMonth = isSameYear && orderDate.getMonth() === selectedDate.getMonth();
    const isSameDay = isSameMonth && orderDate.getDate() === selectedDate.getDate();

    if (filterType === 'day') return isSameDay;
    
    if (filterType === 'week') {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return orderDate >= startOfWeek && orderDate < endOfWeek;
    }

    if (filterType === 'month') return isSameMonth;
    if (filterType === 'year') return isSameYear;
    
    return false;
  });

  const totalSales = filteredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const orderCount = filteredOrders.length;
  const avgOrderValue = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;

  // Period product sales aggregation from completed orders
  const periodProductSales: { [key: string]: { name: string; quantity: number; revenue: number; category?: string } } = {};
  filteredOrders.forEach(order => {
    if (Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        const name = (item.name || 'Unknown').trim();
        if (!periodProductSales[name]) {
          periodProductSales[name] = {
            name,
            quantity: 0,
            revenue: 0,
            category: item.category || 'General'
          };
        }
        const q = Number(item.quantity) || 0;
        const p = Number(item.price) || 0;
        periodProductSales[name].quantity += q;
        periodProductSales[name].revenue += (p * q);
      });
    }
  });

  // Products with recorded sales during the selected period
  const sortedPeriodProducts = Object.values(periodProductSales)
    .filter(p => p.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue);

  // Combine menu products to account for items with 0 sales
  const allPeriodProductsMap: { [key: string]: { name: string; quantity: number; revenue: number; category?: string } } = {};

  // 1. Register menu products (defaulting to 0 sales for this period)
  menuProducts.forEach(prod => {
    const name = prod.name?.trim();
    if (name) {
      allPeriodProductsMap[name.toLowerCase()] = {
        name,
        quantity: 0,
        revenue: 0,
        category: prod.category || 'General'
      };
    }
  });

  // 2. Overlay actual sales from completed orders in this period
  Object.values(periodProductSales).forEach(sold => {
    const key = sold.name.toLowerCase();
    allPeriodProductsMap[key] = {
      name: sold.name,
      quantity: sold.quantity,
      revenue: sold.revenue,
      category: sold.category || allPeriodProductsMap[key]?.category || 'General'
    };
  });

  const allPeriodProductsList = Object.values(allPeriodProductsMap);
  const productsWithSales = allPeriodProductsList
    .filter(p => p.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue);
  const productsWithZeroSales = allPeriodProductsList
    .filter(p => p.quantity === 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Determine Best-Selling and Least-Selling Products
  let bestSellersPeriod: { name: string; quantity: number; revenue: number; category?: string }[] = [];
  let leastSellersPeriod: { name: string; quantity: number; revenue: number; category?: string }[] = [];
  let isSingleProductNoComparison = false;

  if (productsWithSales.length > 0) {
    if (productsWithZeroSales.length > 0) {
      // Products with sales exist alongside 0-sales menu products:
      // Best-Selling: Top performers with sales (up to 5)
      bestSellersPeriod = productsWithSales.slice(0, 5);
      const bestSellerNames = new Set(bestSellersPeriod.map(p => p.name.toLowerCase()));

      // Least-Selling: Menu items with 0 sales and low-velocity products, strictly excluding best sellers
      leastSellersPeriod = allPeriodProductsList
        .filter(p => !bestSellerNames.has(p.name.toLowerCase()))
        .sort((a, b) => a.quantity - b.quantity || a.revenue - b.revenue || a.name.localeCompare(b.name))
        .slice(0, 5);
    } else {
      // All catalog products have sales (no 0-sales items)
      if (productsWithSales.length === 1) {
        // Only one product has recorded sales during this period and no other products exist
        bestSellersPeriod = productsWithSales.slice(0, 1);
        leastSellersPeriod = [];
        isSingleProductNoComparison = true;
      } else {
        // Multiple products with sales: partition so top and bottom don't overlap unless genuinely required
        const bestCount = Math.min(5, Math.max(1, Math.floor(productsWithSales.length / 2)));
        bestSellersPeriod = productsWithSales.slice(0, bestCount);
        const bestSellerNames = new Set(bestSellersPeriod.map(p => p.name.toLowerCase()));

        leastSellersPeriod = productsWithSales
          .filter(p => !bestSellerNames.has(p.name.toLowerCase()))
          .sort((a, b) => a.quantity - b.quantity || a.revenue - b.revenue)
          .slice(0, 5);
      }
    }
  }

  const changePeriod = (delta: number) => {
    const newDate = new Date(selectedDate);
    if (filterType === 'day') newDate.setDate(newDate.getDate() + delta);
    if (filterType === 'week') newDate.setDate(newDate.getDate() + (delta * 7));
    if (filterType === 'month') newDate.setMonth(newDate.getMonth() + delta);
    if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() + delta);
    setSelectedDate(newDate);
  };

  const getPeriodLabel = () => {
    if (filterType === 'day') {
      return selectedDate.toLocaleDateString('en-US', { 
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
      });
    }
    if (filterType === 'week') {
      const start = new Date(selectedDate);
      start.setDate(selectedDate.getDate() - selectedDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (filterType === 'month') {
      return selectedDate.toLocaleDateString('en-US', { 
        month: 'long', year: 'numeric' 
      });
    }
    return selectedDate.getFullYear().toString();
  };

  const isFuture = () => {
    const now = new Date();
    if (filterType === 'day') return selectedDate.toDateString() === now.toDateString();
    if (filterType === 'month') return selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear();
    if (filterType === 'year') return selectedDate.getFullYear() === now.getFullYear();
    return false;
  };

  // Generate trend line data based on the current period selection
  const trendData = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === 'Completed');

    if (filterType === 'day') {
      // 7-day trend leading up to and including selectedDate (matching reference design)
      const points = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(selectedDate);
        d.setDate(selectedDate.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);

        const daySales = completedOrders
          .filter(order => {
            const orderDate = new Date(order.date || order.createdAt);
            return orderDate >= d && orderDate < nextD;
          })
          .reduce((sum, order) => sum + Number(order.total || 0), 0);

        points.push({
          label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          revenue: daySales,
          isSelected: i === 0
        });
      }
      return points;
    }

    if (filterType === 'week') {
      // 7 days of the selected week (Sunday through Saturday)
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const points = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);

        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);

        const daySales = completedOrders
          .filter(order => {
            const orderDate = new Date(order.date || order.createdAt);
            return orderDate >= d && orderDate < nextD;
          })
          .reduce((sum, order) => sum + Number(order.total || 0), 0);

        points.push({
          label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDateLabel: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
          revenue: daySales,
          isSelected: d.toDateString() === selectedDate.toDateString()
        });
      }
      return points;
    }

    if (filterType === 'month') {
      // All days of the selected month
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const points = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day, 0, 0, 0, 0);
        const nextD = new Date(year, month, day + 1, 0, 0, 0, 0);

        const daySales = completedOrders
          .filter(order => {
            const orderDate = new Date(order.date || order.createdAt);
            return orderDate >= d && orderDate < nextD;
          })
          .reduce((sum, order) => sum + Number(order.total || 0), 0);

        points.push({
          label: `${d.toLocaleDateString('en-US', { month: 'short' })} ${day}`,
          fullDateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          revenue: daySales,
          isSelected: d.toDateString() === selectedDate.toDateString()
        });
      }
      return points;
    }

    if (filterType === 'year') {
      // 12 months of the selected year
      const year = selectedDate.getFullYear();
      const points = [];
      for (let m = 0; m < 12; m++) {
        const startOfMonth = new Date(year, m, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(year, m + 1, 1, 0, 0, 0, 0);

        const monthSales = completedOrders
          .filter(order => {
            const orderDate = new Date(order.date || order.createdAt);
            return orderDate >= startOfMonth && orderDate < endOfMonth;
          })
          .reduce((sum, order) => sum + Number(order.total || 0), 0);

        points.push({
          label: startOfMonth.toLocaleDateString('en-US', { month: 'short' }),
          fullDateLabel: startOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          revenue: monthSales,
          isSelected: m === selectedDate.getMonth()
        });
      }
      return points;
    }

    return [];
  }, [orders, filterType, selectedDate]);

  const maxRevenue = useMemo(() => {
    return trendData.reduce((max, d) => Math.max(max, d.revenue), 0);
  }, [trendData]);

  const yDomainMax = useMemo(() => {
    if (maxRevenue <= 0) return 2000;
    const target = maxRevenue * 1.2;
    if (target <= 2000) return 2000;
    const step = target > 20000 ? 5000 : target > 5000 ? 2000 : 1000;
    return Math.ceil(target / step) * step;
  }, [maxRevenue]);

  const yTicks = useMemo(() => {
    const step = yDomainMax / 4;
    return [0, step, step * 2, step * 3, yDomainMax];
  }, [yDomainMax]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-3 py-2 rounded-lg border border-orange-300 shadow-sm text-left">
          <p className="text-[11px] text-gray-700 font-medium">
            {data.fullDateLabel}
          </p>
          <p className="text-sm font-black text-dark tracking-tight mt-0.5">
            ₱{Number(data.revenue).toLocaleString('en-US')}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const item = (typeof payload.index === 'number' && trendData[payload.index])
      ? trendData[payload.index]
      : trendData.find(d => d.label === payload.value);
    const isSelected = item?.isSelected;
    return (
      <text
        x={x}
        y={y + 14}
        textAnchor="middle"
        fill={isSelected ? '#ea580c' : '#64748b'}
        fontSize={11}
        fontWeight={isSelected ? 700 : 500}
      >
        {payload.value}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-white p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                {filterType === 'day' ? 'Daily' : filterType === 'week' ? 'Weekly' : filterType === 'month' ? 'Monthly' : 'Annual'} Revenue
              </p>
              <h3 className="text-2xl font-black text-dark tracking-tight">{formatPrice(totalSales)}</h3>
              <p className="text-[11px] text-green-700 font-bold mt-1 flex items-center gap-1">
                <TrendingUp size={12} /> Completed payments
              </p>
            </div>
            <div className="w-10 h-10 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Orders Processed</p>
              <h3 className="text-2xl font-black text-dark tracking-tight">{orderCount}</h3>
              <p className="text-[11px] text-blue-700 font-bold mt-1 flex items-center gap-1">
                <ShoppingBag size={12} /> Successful orders
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Average Order Value</p>
              <h3 className="text-2xl font-black text-dark tracking-tight">{formatPrice(avgOrderValue)}</h3>
              <p className="text-[11px] text-gray-600 font-bold mt-1 flex items-center gap-1">
                <Layers size={12} /> Per customer ticket
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg flex items-center justify-center">
              <BarChart2 size={20} />
            </div>
          </div>
        </div>

        {/* Sales Trend Graph Section */}
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-base sm:text-lg font-bold text-dark tracking-tight">Sales Trend</h2>

            <div className="flex flex-wrap items-center gap-2">
              {/* Period Filter Buttons */}
              <div className="flex bg-white p-1 rounded-lg border border-gray-300">
                {(['day', 'week', 'month', 'year'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                      filterType === type 
                        ? 'bg-dark text-white' 
                        : 'text-gray-600 hover:text-dark'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Date Stepper */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-gray-300">
                <button 
                  onClick={() => changePeriod(-1)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                  title="Previous"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1.5 px-2 border-x border-gray-200">
                  <Calendar size={13} className="text-gray-500" />
                  <span className="font-bold text-dark text-xs min-w-[120px] text-center">
                    {getPeriodLabel()}
                  </span>
                </div>
                <button 
                  onClick={() => changePeriod(1)}
                  disabled={isFuture()}
                  className="p-1 hover:bg-gray-100 rounded text-gray-600 transition-colors disabled:opacity-20"
                  title="Next"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="h-[280px] sm:h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 15, right: 20, left: 10, bottom: 15 }}
              >
                <CartesianGrid stroke="#f1f3f5" vertical={true} horizontal={true} />
                <XAxis
                  dataKey="label"
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  interval={filterType === 'month' ? (trendData.length > 20 ? 2 : 1) : 0}
                  tick={renderCustomXAxisTick}
                />
                <YAxis
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  domain={[0, yDomainMax]}
                  ticks={yTicks}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  tickFormatter={(val) => `₱${Number(val).toLocaleString('en-US')}`}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#f97316', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                />
                <Line
                  type="linear"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{
                    r: 4,
                    fill: '#ea580c',
                    stroke: '#ffffff',
                    strokeWidth: 1
                  }}
                  activeDot={{
                    r: 4,
                    fill: '#ea580c',
                    stroke: '#ffffff',
                    strokeWidth: 1
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
              activeTab === 'transactions' 
                ? 'bg-dark text-white border-dark' 
                : 'bg-white text-gray-600 border-gray-300 hover:text-dark'
            }`}
          >
            Orders Log ({filteredOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('product-analysis')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
              activeTab === 'product-analysis' 
                ? 'bg-dark text-white border-dark' 
                : 'bg-white text-gray-600 border-gray-300 hover:text-dark'
            }`}
          >
            Product Analysis
          </button>
        </div>

        {/* Tab 1: Orders Log Table */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xs font-bold text-dark uppercase tracking-wider">Completed Orders ({getPeriodLabel()})</h2>
              </div>
              <span className="bg-gray-200 text-dark px-2.5 py-0.5 rounded text-xs font-bold border border-gray-300">
                {formatPrice(totalSales)} Total
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[10px] uppercase tracking-wider font-bold">
                    <th className="p-3.5">Order ID</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Items Breakdown</th>
                    <th className="p-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 font-medium">
                        No completed orders recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3.5 font-mono text-[11px] font-bold text-gray-500">{order.id}</td>
                        <td className="p-3.5 font-bold text-dark">
                          <div>{new Date(order.date || order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-[10px] text-gray-400 font-normal">{new Date(order.date || order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="p-3.5 font-bold text-dark">{order.customer?.name || 'Customer'}</td>
                        <td className="p-3.5">
                          <span className="bg-gray-100 text-gray-700 font-bold text-[10px] px-2 py-0.5 rounded border border-gray-200 uppercase">
                            {order.paymentMethod || 'Cash'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {order.items?.map((item: any, idx: number) => (
                              <span key={`${item.name}-${idx}`} className="bg-gray-50 border border-gray-200 text-dark px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                {item.quantity}x {item.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5 text-right font-black text-dark text-xs">
                          {formatPrice(order.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Product Analysis */}
        {activeTab === 'product-analysis' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Best Selling Products */}
              <div className="bg-white p-5 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                    <Award size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-dark uppercase tracking-wider">Best-Selling Products</h3>
                    <p className="text-[10px] text-gray-500 font-medium">Top performers during selected period</p>
                  </div>
                </div>

                {bestSellersPeriod.length === 0 ? (
                  <p className="text-center py-6 text-xs text-gray-400 font-medium">No product sales in this period.</p>
                ) : (
                  <div className="space-y-2">
                    {bestSellersPeriod.map((prod, idx) => (
                      <div key={prod.name} className="p-3 rounded-lg bg-gray-50 flex items-center justify-between border border-gray-200">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                            idx === 0 ? 'bg-dark text-white' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-dark">{prod.name}</p>
                            <p className="text-[10px] text-gray-500">{prod.quantity} units sold</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-dark">{formatPrice(prod.revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Least Selling Products */}
              <div className="bg-white p-5 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center justify-center font-bold">
                    <AlertCircle size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-dark uppercase tracking-wider">Least-Selling Products</h3>
                    <p className="text-[10px] text-gray-500 font-medium">Low velocity items to monitor</p>
                  </div>
                </div>

                {leastSellersPeriod.length === 0 ? (
                  <p className="text-center py-6 text-xs text-gray-400 font-medium px-4">
                    {isSingleProductNoComparison 
                      ? 'No comparison available — only one product has recorded sales during this period.' 
                      : 'No data available.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {leastSellersPeriod.map((prod) => (
                      <div key={prod.name} className="p-3 rounded-lg bg-gray-50 flex items-center justify-between border border-gray-200">
                        <div>
                          <p className="text-xs font-bold text-dark">{prod.name}</p>
                          <p className="text-[10px] text-gray-500">{prod.quantity} units sold</p>
                        </div>
                        <span className="text-xs font-bold text-gray-600">{formatPrice(prod.revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* All Products Sold Breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-xs font-bold text-dark uppercase tracking-wider mb-3">Full Quantity Sold Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {sortedPeriodProducts.length === 0 ? (
                  <p className="text-xs text-gray-400 font-medium py-4 text-center col-span-full">
                    No product sales in this period.
                  </p>
                ) : (
                  sortedPeriodProducts.map((p) => (
                    <div key={p.name} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-dark truncate max-w-[150px]">{p.name}</p>
                        <p className="text-[10px] text-gray-500">Qty: {p.quantity}</p>
                      </div>
                      <span className="text-xs font-bold text-dark">{formatPrice(p.revenue)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReport;
