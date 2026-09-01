import { useState, useEffect } from 'react';
import { fetchOrders } from '../api/orderService';
import { fetchInventory } from '../api/inventoryService';
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
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp, Package, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'all'>('daily');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersData, inventoryData] = await Promise.all([
        fetchOrders(),
        fetchInventory()
      ]);
      setOrders(ordersData || []);
      setInventory(inventoryData || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
    <div className="min-h-screen py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-dark tracking-tight">Overview & Analytics</h1>
            <p className="text-xs text-gray-500 mt-1">Real-time performance summary and inventory levels</p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-center">
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setReportPeriod('daily')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
                  reportPeriod === 'daily' 
                    ? 'bg-white text-dark border border-gray-200' 
                    : 'text-gray-500 hover:text-dark'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setReportPeriod('all')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
                  reportPeriod === 'all' 
                    ? 'bg-white text-dark border border-gray-200' 
                    : 'text-gray-500 hover:text-dark'
                }`}
              >
                All-Time
              </button>
            </div>
            <button
              onClick={loadData}
              className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-dark rounded-lg transition-colors"
              title="Refresh Dashboard"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Sales */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                {reportPeriod === 'daily' ? "Today's Sales" : "Lifetime Sales"}
              </p>
              <h3 className="text-2xl font-black text-dark tracking-tight">₱{headlineSales.toLocaleString()}</h3>
              {reportPeriod === 'daily' && (
                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Overall: ₱{lifetimeSales.toLocaleString()}</p>
              )}
            </div>
            <div className="w-10 h-10 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>

          {/* Ready to Pickup Orders */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ready for Pickup</p>
              <h3 className="text-2xl font-black text-dark tracking-tight">{readyToPickupOrders}</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Active pick-up orders</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Low Stock Alerts</p>
              <h3 className="text-2xl font-black text-dark tracking-tight">{lowStockCount}</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">{lowStockCount > 0 ? "Items require restocking" : "Stock levels optimal"}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${lowStockCount > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventory Levels Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-gray-100 rounded border border-gray-200 text-gray-600">
                <Package size={16} />
              </div>
              <h2 className="text-sm font-bold text-dark uppercase tracking-wider">Current Inventory Levels</h2>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 60]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 600 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: 'none', fontSize: '12px', fontWeight: 600 }}
                  />
                  <Bar dataKey="quantity" radius={[4, 4, 0, 0]} barSize={32}>
                    {inventory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product Rankings Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-gray-100 rounded border border-gray-200 text-gray-600">
                <TrendingUp size={16} />
              </div>
              <h2 className="text-sm font-bold text-dark uppercase tracking-wider">
                Top Ordered Items ({reportPeriod === 'daily' ? "Today" : "All-Time"})
              </h2>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#374151', fontSize: 11, fontWeight: 700 }}
                    width={100}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: 'none', fontSize: '12px', fontWeight: 600 }}
                  />
                  <Bar dataKey="sales" fill="#ea580c" radius={[0, 4, 4, 0]} barSize={24} />
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
