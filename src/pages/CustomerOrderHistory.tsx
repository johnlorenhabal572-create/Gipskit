import { useState, useEffect } from 'react';
import { getOrders, deleteOrder } from '../api/orderService';
import { ClipboardList, Search, Clock, Eye, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CustomerOrderHistory = () => {
  const [myOrders, setMyOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    const allOrders = getOrders();
    const myOrderIds = JSON.parse(localStorage.getItem('my_order_ids') || '[]');
    
    const userOrders = allOrders.filter(order => 
      myOrderIds.includes(order.id) && 
      order.status !== 'Pending'
    );
    
    userOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setMyOrders(userOrders);
  };

  const handleDelete = (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order from your history?')) {
      deleteOrder(orderId);
      // Remove from my_order_ids as well if needed, but the filtered result won't show it anyway if deleted from capstone_orders
      fetchOrders();
    }
  };

  const filteredOrders = myOrders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      
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
                      order.status === 'Ready to Pickup' ? 'bg-purple-100 text-purple-700' :
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
              
              <div className="flex flex-col md:items-end gap-3 shrink-0">
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                    title="View Details"
                  >
                    <Eye size={20} />
                  </button>
                  <button 
                    onClick={() => handleDelete(order.id)}
                    className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Order"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="flex -space-x-2">
                  {order.items.slice(0, 3).map((item, i) => (
                    <div key={`${item.name}-${i}`} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 overflow-hidden">
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

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="font-bold text-dark">Order Details</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">{selectedOrder.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100 p-1">
                        <img 
                          src={item.image || 'https://picsum.photos/seed/food/200/200'} 
                          alt={item.name} 
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-dark text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-400">₱{item.price} x {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-dark">₱{item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-8 border-t border-dashed border-gray-100 flex justify-between items-end">
                   <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      selectedOrder.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Bill</p>
                    <p className="text-3xl font-black text-primary tracking-tighter">₱{selectedOrder.total}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50/50 border-t border-gray-50 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ordered on {new Date(selectedOrder.date).toLocaleString()}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
