import { useState, useEffect, useContext } from 'react';
import { getOrders, deleteOrder } from '../api/orderService';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, Receipt as ReceiptIcon, History as HistoryIcon, Search as SearchIcon, Trash2 } from 'lucide-react';

const TransactionHistory = () => {
  const { user } = useContext(AuthContext) as any;
  const [myOrders, setMyOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Completed');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    setMyOrders(getOrders());
  };

  const handleDelete = (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction from record?')) {
      deleteOrder(orderId);
      fetchOrders();
    }
  };

  // Apply Search and Filter logic
  const filteredOrders = myOrders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      order.id.toLowerCase().includes(searchLower) || 
      order.customer.name.toLowerCase().includes(searchLower);
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      
      {/* Search and Filter Controls */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Order ID or Customer Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-dark font-medium"
          />
        </div>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-50 border-none p-3 rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold text-gray-600"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="On Delivery">On Delivery</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Order List */}
      <div className="grid gap-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No transactions found matching your criteria.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 hover:shadow-md transition-all flex flex-col md:flex-row justify-between md:items-center gap-6">
              <div className="flex flex-1 gap-4 items-start">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <Receipt size={24} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-gray-400 uppercase tracking-tighter">{order.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                      order.status === 'On Delivery' ? 'bg-purple-100 text-purple-700' :
                      order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg text-gray-800">{order.customer.name}</h4>
                  <p className="text-xs text-gray-500 font-medium">
                    {new Date(order.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-2 border-r border-gray-100 pr-4">
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
                    title="Delete Transaction"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {order.paymentScreenshot && (
                  <button 
                    onClick={() => setPreviewImage(order.paymentScreenshot)}
                    className="group/receipt relative block shrink-0"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                      <img 
                        src={order.paymentScreenshot} 
                        alt="Receipt" 
                        className="w-full h-full object-cover transition-transform group-hover/receipt:scale-110" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover/receipt:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <Eye className="text-white" size={12} />
                    </div>
                  </button>
                )}
                <div className="flex flex-col md:items-end gap-1">
                  <p className="text-2xl font-bold text-primary tracking-tighter">₱{order.total}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.items.length} Item(s) • {order.paymentMethod}</p>
                </div>
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
                  <h3 className="font-bold text-dark">Transaction Details</h3>
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

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-dark/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
            onClick={() => setPreviewImage(null)}
          >
            <button 
              className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 p-2 rounded-full transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              <X size={32} />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-full max-h-full sm:max-w-3xl flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={previewImage} 
                alt="Receipt Preview" 
                className="max-w-full max-h-[80vh] object-contain rounded-3xl shadow-2xl border-4 border-white/10"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const History = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
);

const Search = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

const Receipt = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6"/><path d="M16 12H8"/><path d="M13 16H8"/></svg>
);

export default TransactionHistory;
