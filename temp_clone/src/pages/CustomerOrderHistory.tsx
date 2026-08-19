import { useState, useEffect } from 'react';
import { getOrders } from '../api/orderService';
import { ClipboardList, Search, Clock } from 'lucide-react';

const CustomerOrderHistory = () => {
  const [myOrders, setMyOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const allOrders = getOrders();
    const myOrderIds = JSON.parse(localStorage.getItem('my_order_ids') || '[]');
    
    // Anonymous customers see orders matching IDs in their local storage
    const userOrders = allOrders.filter(order => myOrderIds.includes(order.id));
    
    // Sort by date descending
    userOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setMyOrders(userOrders);
  }, []);

  const filteredOrders = myOrders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-3 rounded-2xl text-primary">
          <ClipboardList size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
          <p className="text-gray-500 text-sm font-medium">Track your recent food orders</p>
        </div>
      </div>
      
      {/* Search Box */}
      {myOrders.length > 0 && (
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Order ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 shadow-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      )}

      {/* Order List */}
      <div className="space-y-4">
        {myOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Orders Found</h3>
            <p className="text-gray-500 max-w-xs mx-auto">You haven't placed any orders on this device yet. Start ordering to see your history here!</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <p className="text-gray-500 p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">No orders match your search.</p>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 hover:shadow-md transition-all flex flex-col md:flex-row justify-between md:items-center gap-6">
              <div className="flex gap-4 items-start">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <Utensils size={24} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-gray-400 uppercase tracking-tighter">{order.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                      order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg text-gray-800">₱{order.total}</h4>
                  <p className="text-xs text-gray-500 font-medium">
                    {new Date(order.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col md:items-end gap-3">
                <div className="flex -space-x-2">
                  {order.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 overflow-hidden">
                      {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : item.name.charAt(0)}
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-800 flex items-center justify-center text-[10px] font-bold text-white">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{order.items.length} Item(s)</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Helper icon since it's not imported
const Utensils = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

export default CustomerOrderHistory;
