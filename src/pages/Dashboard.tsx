import { useState, useEffect } from 'react';
import { getOrders } from '../api/orderService';
import { getInventory } from '../api/inventoryService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp, Package } from 'lucide-react';

const Dashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'all'>('daily');

  useEffect(() => {
    setOrders(getOrders());
    setInventory(getInventory());
  }, []);

  const today = new Date().toDateString();
  const completedOrders = orders.filter(o => o.status === 'Completed');
  
  // Stats based on period
  const statsOrders = reportPeriod === 'daily' 
    ? completedOrders.filter(o => new Date(o.date).toDateString() === today)
    : completedOrders;

  const totalSales = statsOrders.reduce((sum, o) => sum + o.total, 0);
  const headlineSales = totalSales;
  
  const lifetimeSales = completedOrders.reduce((sum, o) => sum + o.total, 0);
  
  const readyToPickupOrders = orders.filter(o => o.status === 'Ready to Pickup').length;
  const lowStockCount = inventory.filter(item => item.quantity <= (item.lowStockThreshold || 10)).length;

  // Prepare Inventory Data for Chart
  const inventoryData = inventory.map(item => ({
    name: item.name,
    quantity: item.quantity,
  }));

  // Prepare Product Rankings Data (Today vs All Time)
  const productSales: { [key: string]: number } = {};
  statsOrders.forEach(order => {
    order.items.forEach((item: any) => {
      productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
    });
  });

  const rankingData = Object.entries(productSales)
    .map(([name, sales]) => ({ name, sales }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const getBarColor = (item: any) => {
    const threshold = item.lowStockThreshold || 10;
    if (item.quantity <= threshold) return '#ef4444'; // Red
    if (item.quantity <= threshold * 2) return '#eab308'; // Yellow
    return '#3b82f6'; // Blue/Stable
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-dark tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Real-time overview of your store's performance.</p>
          </div>
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm self-start md:self-center">
            <button
              onClick={() => setReportPeriod('daily')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                reportPeriod === 'daily' 
                  ? 'bg-dark text-white shadow-lg' 
                  : 'text-gray-400 hover:text-dark'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setReportPeriod('all')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                reportPeriod === 'all' 
                  ? 'bg-dark text-white shadow-lg' 
                  : 'text-gray-400 hover:text-dark'
              }`}
            >
              All-Time
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Total Sales */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center group hover:shadow-md transition-all">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                {reportPeriod === 'daily' ? "Today's Sales" : "Lifetime Sales"}
              </p>
              <h3 className="text-2xl font-bold text-dark tracking-tighter">₱{headlineSales.toLocaleString()}</h3>
              {reportPeriod === 'daily' && (
                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Overall: ₱{lifetimeSales.toLocaleString()}</p>
              )}
            </div>
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign size={24} />
            </div>
          </div>

          {/* Ready to Pickup Orders */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center group hover:shadow-md transition-all">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ready to Pickup Orders</p>
              <h3 className="text-2xl font-bold text-dark tracking-tighter">{readyToPickupOrders}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag size={24} />
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center group hover:shadow-md transition-all">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Low Stock Alerts</p>
              <h3 className="text-2xl font-bold text-dark tracking-tighter">{lowStockCount}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inventory Levels Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                <Package size={20} />
              </div>
              <h2 className="text-lg font-bold text-dark">Current Inventory Levels</h2>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 60]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="quantity" radius={[6, 6, 0, 0]} barSize={40}>
                    {inventory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product Rankings Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                <TrendingUp size={20} />
              </div>
              <h2 className="text-lg font-bold text-dark">
                Menu Rankings ({reportPeriod === 'daily' ? "Today" : "All-Time"})
              </h2>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 700 }}
                    width={100}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="sales" fill="#fb923c" radius={[0, 6, 6, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
