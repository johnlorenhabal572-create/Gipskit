import { useState, useEffect } from 'react';
import { getOrders } from '../api/orderService';
import { motion } from 'motion/react';
import { Calendar, TrendingUp, ShoppingBag, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

const SalesReport = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  // Filter orders for the selected day
  const dailyOrders = orders.filter(order => {
    const orderDate = new Date(order.date);
    return (
      orderDate.getDate() === selectedDate.getDate() &&
      orderDate.getMonth() === selectedDate.getMonth() &&
      orderDate.getFullYear() === selectedDate.getFullYear() &&
      order.status === 'Completed'
    );
  });

  const dailyTotalSales = dailyOrders.reduce((sum, order) => sum + order.total, 0);
  const dailyOrderCount = dailyOrders.length;

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-dark tracking-tight">Daily Sales Report</h1>
            <p className="text-gray-500 mt-1">Automated daily performance tracking.</p>
          </div>

          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <button 
              onClick={() => changeDate(-1)}
              className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2 px-4 py-1 border-x border-gray-100">
              <Calendar size={18} className="text-primary" />
              <span className="font-bold text-dark min-w-[140px] text-center">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <button 
              onClick={() => changeDate(1)}
              disabled={selectedDate.toDateString() === new Date().toDateString()}
              className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors disabled:opacity-20"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </header>

        {/* Daily Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Daily Revenue</p>
              <h3 className="text-4xl font-bold text-dark tracking-tighter">₱{dailyTotalSales.toLocaleString()}</h3>
              <p className="text-xs text-green-500 font-bold mt-2 flex items-center gap-1">
                <TrendingUp size={12} /> Today's earnings
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
              <h3 className="text-4xl font-bold text-dark tracking-tighter">{dailyOrderCount}</h3>
              <p className="text-xs text-blue-500 font-bold mt-2 flex items-center gap-1">
                <ShoppingBag size={12} /> Completed transactions
              </p>
            </div>
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag size={32} />
            </div>
          </motion.div>
        </div>

        {/* Daily Orders Table */}
        <div className="mt-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-dark">Orders for this day</h2>
            <span className="bg-gray-100 text-gray-500 px-4 py-1 rounded-full text-xs font-bold">
              {dailyOrders.length} Transactions
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                  <th className="p-6">Order ID</th>
                  <th className="p-6">Time</th>
                  <th className="p-6">Customer</th>
                  <th className="p-6">Items</th>
                  <th className="p-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dailyOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-400 font-medium">
                      No completed orders recorded for this date.
                    </td>
                  </tr>
                ) : (
                  dailyOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-6 font-mono text-xs text-gray-400">{order.id}</td>
                      <td className="p-6 text-sm font-medium text-dark">
                        {new Date(order.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-6 text-sm font-bold text-dark">{order.customer.name}</td>
                      <td className="p-6">
                        <div className="flex flex-wrap gap-1">
                          {order.items.map((item: any, idx: number) => (
                            <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">
                              {item.quantity}x {item.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-6 text-right font-bold text-primary">₱{order.total}</td>
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
