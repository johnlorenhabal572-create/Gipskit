import { useState, useEffect } from 'react';
import { fetchOrders, fetchProductAnalysis } from '../api/orderService';
import { 
  Calendar, TrendingUp, ShoppingBag, DollarSign, ChevronLeft, ChevronRight,
  BarChart2, Award, AlertCircle, Printer, RefreshCw, Layers
} from 'lucide-react';

const SalesReport = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'transactions' | 'product-analysis'>('transactions');

  const loadData = async () => {
    try {
      const [orderList] = await Promise.all([
        fetchOrders({ status: 'Completed' }),
        fetchProductAnalysis()
      ]);
      setOrders(orderList || []);
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
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-dark tracking-tight">Sales & Analytics</h1>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mt-0.5">
                Performance & Revenue Breakdown
              </p>
            </div>

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
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Actions */}
              <button 
                onClick={loadData}
                className="p-2 bg-white border border-gray-300 text-gray-600 hover:text-dark rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={15} />
              </button>
              <button 
                onClick={handlePrint}
                className="px-3.5 py-2 bg-dark text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-primary transition-colors uppercase tracking-wider"
              >
                <Printer size={15} />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>
        </header>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                {filterType === 'day' ? 'Daily' : filterType === 'week' ? 'Weekly' : filterType === 'month' ? 'Monthly' : 'Annual'} Revenue
              </p>
              <h3 className="text-2xl font-black text-dark tracking-tight">₱{totalSales.toLocaleString()}</h3>
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
              <h3 className="text-2xl font-black text-dark tracking-tight">₱{avgOrderValue.toLocaleString()}</h3>
              <p className="text-[11px] text-gray-600 font-bold mt-1 flex items-center gap-1">
                <Layers size={12} /> Per customer ticket
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg flex items-center justify-center">
              <BarChart2 size={20} />
            </div>
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
                ₱{totalSales.toLocaleString()} Total
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
                        <span className="text-xs font-bold text-dark">₱{prod.revenue.toLocaleString()}</span>
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
                  <p className="text-center py-6 text-xs text-gray-400 font-medium">No data available.</p>
                ) : (
                  <div className="space-y-2">
                    {leastSellersPeriod.map((prod) => (
                      <div key={prod.name} className="p-3 rounded-lg bg-gray-50 flex items-center justify-between border border-gray-200">
                        <div>
                          <p className="text-xs font-bold text-dark">{prod.name}</p>
                          <p className="text-[10px] text-gray-500">{prod.quantity} units sold</p>
                        </div>
                        <span className="text-xs font-bold text-gray-600">₱{prod.revenue.toLocaleString()}</span>
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
                {sortedPeriodProducts.map((p) => (
                  <div key={p.name} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-dark truncate max-w-[150px]">{p.name}</p>
                      <p className="text-[10px] text-gray-500">Qty: {p.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-dark">₱{p.revenue.toLocaleString()}</span>
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
