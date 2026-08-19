import { useState, useEffect } from 'react';
import { getOrders } from '../api/orderService';
import { motion } from 'motion/react';
import { Calendar, TrendingUp, ShoppingBag, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

const SalesReport = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'day' | 'month' | 'year'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  // Filter orders based on the selected period
  const filteredOrders = orders.filter(order => {
    if (order.status !== 'Completed') return false;
    
    const orderDate = new Date(order.date);
    const isSameYear = orderDate.getFullYear() === selectedDate.getFullYear();
    const isSameMonth = isSameYear && orderDate.getMonth() === selectedDate.getMonth();
    const isSameDay = isSameMonth && orderDate.getDate() === selectedDate.getDate();

    if (filterType === 'day') return isSameDay;
    if (filterType === 'month') return isSameMonth;
    if (filterType === 'year') return isSameYear;
    
    return false;
  });

  const totalSales = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const orderCount = filteredOrders.length;

  const changePeriod = (delta: number) => {
    const newDate = new Date(selectedDate);
    if (filterType === 'day') newDate.setDate(newDate.getDate() + delta);
    if (filterType === 'month') newDate.setMonth(newDate.getMonth() + delta);
    if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() + delta);
    setSelectedDate(newDate);
  };

  const getPeriodLabel = () => {
    if (filterType === 'day') {
      return selectedDate.toLocaleDateString('en-US', { 
        weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' 
      });
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="hidden">
              <h1 className="text-3xl font-bold text-dark tracking-tight">Sales Report</h1>
              <p className="text-gray-500 mt-1">Automated performance tracking by period.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                {(['day', 'month', 'year'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 sm:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      filterType === type 
                        ? 'bg-dark text-white shadow-lg' 
                        : 'text-gray-400 hover:text-dark hover:bg-gray-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                <button 
                  onClick={() => changePeriod(-1)}
                  className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2 px-2 sm:px-4 py-1 border-x border-gray-100">
                  <Calendar size={18} className="text-primary" />
                  <span className="font-bold text-dark min-w-[120px] sm:min-w-[140px] text-xs sm:text-sm text-center">
                    {getPeriodLabel()}
                  </span>
                </div>
                <button 
                  onClick={() => changePeriod(1)}
                  disabled={isFuture()}
                  className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors disabled:opacity-20"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                {filterType === 'day' ? 'Daily' : filterType === 'month' ? 'Monthly' : 'Annual'} Revenue
              </p>
              <h3 className="text-4xl font-bold text-dark tracking-tighter">₱{totalSales.toLocaleString()}</h3>
              <p className="text-xs text-green-500 font-bold mt-2 flex items-center gap-1">
                <TrendingUp size={12} /> Total earnings
              </p>
            </div>
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign size={32} />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
              <h3 className="text-4xl font-bold text-dark tracking-tighter">{orderCount}</h3>
              <p className="text-xs text-blue-500 font-bold mt-2 flex items-center gap-1">
                <ShoppingBag size={12} /> Completed transactions
              </p>
            </div>
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag size={32} />
            </div>
          </motion.div>
        </div>

        <div className="mt-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-dark">Orders for this {filterType}</h2>
            <span className="bg-gray-100 text-gray-500 px-4 py-1 rounded-full text-xs font-bold">
              {filteredOrders.length} Transactions
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                  <th className="p-6">Order ID</th>
                  <th className="p-6">Date & Time</th>
                  <th className="p-6">Customer</th>
                  <th className="p-6">Items</th>
                  <th className="p-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-400 font-medium">
                      No completed orders recorded for this period.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-6 font-mono text-xs text-gray-400">{order.id}</td>
                      <td className="p-6 text-sm font-medium text-dark">
                        <div>
                          {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {new Date(order.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-6 text-sm font-bold text-dark">{order.customer.name}</td>
                      <td className="p-6">
                        <div className="flex flex-wrap gap-1">
                          {order.items.map((item: any, idx: number) => (
                            <span key={`${item.name}-${idx}`} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">
                              {item.quantity}x {item.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-6 text-right font-bold text-primary">₱{order.total.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
