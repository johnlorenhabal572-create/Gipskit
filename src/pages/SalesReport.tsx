import { useState, useEffect } from 'react';
import { fetchOrders, fetchSalesSummary, fetchProductAnalysis } from '../api/orderService';
import { motion } from 'motion/react';
import { 
  Calendar, TrendingUp, ShoppingBag, DollarSign, ChevronLeft, ChevronRight,
  BarChart2, Award, AlertCircle, Printer, Download, RefreshCw, Layers
} from 'lucide-react';

const SalesReport = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'transactions' | 'product-analysis'>('transactions');
  const [productAnalysis, setProductAnalysis] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [orderList, prodAnalysis] = await Promise.all([
        fetchOrders({ status: 'Completed' }),
        fetchProductAnalysis()
      ]);
      setOrders(orderList || []);
      setProductAnalysis(prodAnalysis);
    } catch (err) {
      console.error('Failed to load sales report data:', err);
    } finally {
      setIsLoading(false);
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

  // Period product sales aggregation
  const periodProductSales: { [key: string]: { name: string; quantity: number; revenue: number; category?: string } } = {};
  filteredOrders.forEach(order => {
    if (Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        const name = item.name || 'Unknown';
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

  const sortedPeriodProducts = Object.values(periodProductSales).sort((a, b) => b.quantity - a.quantity);
  const bestSellersPeriod = sortedPeriodProducts.slice(0, 5);
  const leastSellersPeriod = [...sortedPeriodProducts].reverse().slice(0, 5);

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-dark tracking-tight">Sales & Analytics</h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">
                MongoDB Atlas Synchronized Performance Tracking
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Period Filter Buttons */}
              <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                {(['day', 'week', 'month', 'year'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 sm:px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      filterType === type 
                        ? 'bg-dark text-white shadow-md' 
                        : 'text-gray-400 hover:text-dark hover:bg-gray-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Date Stepper */}
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                <button 
                  onClick={() => changePeriod(-1)}
                  className="p-1.5 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-2 px-3 py-1 border-x border-gray-100">
                  <Calendar size={15} className="text-primary" />
                  <span className="font-bold text-dark text-xs min-w-[130px] text-center">
                    {getPeriodLabel()}
                  </span>
                </div>
                <button 
                  onClick={() => changePeriod(1)}
                  disabled={isFuture()}
                  className="p-1.5 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors disabled:opacity-20"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Actions */}
              <button 
                onClick={loadData}
                className="p-2.5 bg-white border border-gray-100 text-gray-600 hover:text-dark rounded-2xl shadow-sm transition-all"
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
              <button 
                onClick={handlePrint}
                className="px-4 py-2.5 bg-dark text-white text-xs font-bold rounded-2xl shadow-sm flex items-center gap-1.5 hover:bg-black transition-all"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">Print Report</span>
              </button>
            </div>
          </div>
        </header>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group"
          >
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                {filterType === 'day' ? 'Daily' : filterType === 'week' ? 'Weekly' : filterType === 'month' ? 'Monthly' : 'Annual'} Revenue
              </p>
              <h3 className="text-3xl font-black text-dark tracking-tight">₱{totalSales.toLocaleString()}</h3>
              <p className="text-[11px] text-green-600 font-bold mt-1.5 flex items-center gap-1">
                <TrendingUp size={13} /> Completed payments
              </p>
            </div>
            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <DollarSign size={28} />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group"
          >
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Orders Processed</p>
              <h3 className="text-3xl font-black text-dark tracking-tight">{orderCount}</h3>
              <p className="text-[11px] text-blue-600 font-bold mt-1.5 flex items-center gap-1">
                <ShoppingBag size={13} /> Successful orders
              </p>
            </div>
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag size={28} />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group"
          >
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Average Order Value</p>
              <h3 className="text-3xl font-black text-dark tracking-tight">₱{avgOrderValue.toLocaleString()}</h3>
              <p className="text-[11px] text-purple-600 font-bold mt-1.5 flex items-center gap-1">
                <Layers size={13} /> Per customer ticket
              </p>
            </div>
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <BarChart2 size={28} />
            </div>
          </motion.div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'transactions' 
                ? 'bg-dark text-white shadow-md' 
                : 'bg-white text-gray-400 border border-gray-100 hover:text-dark'
            }`}
          >
            Orders Log ({filteredOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('product-analysis')}
            className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'product-analysis' 
                ? 'bg-dark text-white shadow-md' 
                : 'bg-white text-gray-400 border border-gray-100 hover:text-dark'
            }`}
          >
            Product Analysis
          </button>
        </div>

        {/* Tab 1: Orders Log Table */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-dark tracking-tight">Completed Orders ({getPeriodLabel()})</h2>
                <p className="text-[11px] text-gray-400">Total volume recorded in MongoDB Atlas</p>
              </div>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black">
                ₱{totalSales.toLocaleString()} Total
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-black">
                    <th className="p-4 sm:p-5">Order ID</th>
                    <th className="p-4 sm:p-5">Timestamp</th>
                    <th className="p-4 sm:p-5">Customer</th>
                    <th className="p-4 sm:p-5">Method</th>
                    <th className="p-4 sm:p-5">Items Breakdown</th>
                    <th className="p-4 sm:p-5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-400 font-bold">
                        No completed orders recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-4 sm:p-5 font-mono text-[11px] font-bold text-gray-400">{order.id}</td>
                        <td className="p-4 sm:p-5 font-bold text-dark">
                          <div>{new Date(order.date || order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-[10px] text-gray-400">{new Date(order.date || order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="p-4 sm:p-5 font-bold text-dark">{order.customer?.name || 'Customer'}</td>
                        <td className="p-4 sm:p-5">
                          <span className="bg-gray-100 text-gray-600 font-black text-[10px] px-2.5 py-1 rounded-lg">
                            {order.paymentMethod || 'Cash'}
                          </span>
                        </td>
                        <td className="p-4 sm:p-5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {order.items?.map((item: any, idx: number) => (
                              <span key={`${item.name}-${idx}`} className="bg-gray-50 border border-gray-100 text-dark px-2 py-0.5 rounded text-[10px] font-bold">
                                {item.quantity}x {item.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 sm:p-5 text-right font-black text-primary text-sm">
                          ₱{Number(order.total).toLocaleString()}
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
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Best Selling Products */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                    <Award size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-dark tracking-tight">Best-Selling Products</h3>
                    <p className="text-[11px] text-gray-400 font-bold uppercase">Top performers during selected period</p>
                  </div>
                </div>

                {bestSellersPeriod.length === 0 ? (
                  <p className="text-center py-8 text-xs text-gray-400 font-bold">No product sales in this period.</p>
                ) : (
                  <div className="space-y-3">
                    {bestSellersPeriod.map((prod, idx) => (
                      <div key={prod.name} className="p-4 rounded-2xl bg-gray-50 flex items-center justify-between border border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                            idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-gray-300 text-gray-700' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-dark">{prod.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold">{prod.quantity} units sold</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-primary">₱{prod.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Least Selling Products */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-black">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-dark tracking-tight">Least-Selling Products</h3>
                    <p className="text-[11px] text-gray-400 font-bold uppercase">Low velocity items to monitor</p>
                  </div>
                </div>

                {leastSellersPeriod.length === 0 ? (
                  <p className="text-center py-8 text-xs text-gray-400 font-bold">No data available.</p>
                ) : (
                  <div className="space-y-3">
                    {leastSellersPeriod.map((prod) => (
                      <div key={prod.name} className="p-4 rounded-2xl bg-gray-50 flex items-center justify-between border border-gray-100">
                        <div>
                          <p className="text-xs font-bold text-dark">{prod.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{prod.quantity} units sold</p>
                        </div>
                        <span className="text-xs font-black text-gray-600">₱{prod.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* All Products Sold Breakdown */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h3 className="text-base font-black text-dark mb-4 tracking-tight">Full Quantity Sold Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedPeriodProducts.map((p) => (
                  <div key={p.name} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-dark truncate max-w-[160px]">{p.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold">Qty: {p.quantity}</p>
                    </div>
                    <span className="text-xs font-black text-primary">₱{p.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReport;
