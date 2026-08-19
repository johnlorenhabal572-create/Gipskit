import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from '../api/orderService';
import { X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const handleStatusChange = (orderId, newStatus) => {
    const updatedOrderList = updateOrderStatus(orderId, newStatus);
    setOrders(updatedOrderList); 
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      order.id.toLowerCase().includes(searchLower) || 
      order.customer.name.toLowerCase().includes(searchLower);
      
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'Paid': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Processing': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Ready to Pickup': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Completed': return 'bg-green-50 text-green-700 border-green-100';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="hidden">
            <h1 className="text-4xl font-black text-dark tracking-tighter">MANAGE ORDERS</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Gip's Kitchen Control Panel</p>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {['Pending', 'Paid', 'Processing', 'Ready to Pickup', 'All'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  filterStatus === status 
                    ? 'bg-dark text-white border-dark shadow-xl active:scale-95' 
                    : 'bg-white text-gray-400 border-gray-100 hover:border-dark hover:text-dark'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-gray-100 mb-8 flex items-center">
            <input 
              type="text" 
              placeholder="Track by ID, customer, or phone number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 rounded-xl border-none focus:ring-0 text-dark font-bold placeholder:text-gray-200"
            />
        </div>

        <div className="grid gap-8">
          {filteredOrders.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] shadow-sm border border-gray-100 text-center">
              <p className="text-gray-300 text-lg font-bold uppercase tracking-widest">Zero Orders Found</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-50 flex flex-col xl:flex-row xl:items-stretch gap-8 hover:border-primary/20 transition-all group">
                <div className="flex gap-8 items-start flex-1">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 border-2 font-black text-2xl shadow-inner ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-2xl font-black text-dark tracking-tight">{order.customer.name}</h3>
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-gray-400 mb-6 uppercase font-bold">TXN_REF: {order.id}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50/50 p-5 rounded-[2rem] border border-gray-100">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">Customer Credentials</p>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-dark">{order.customer.phone}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item, idx) => (
                        <div key={`${item.id || item.name}-${idx}`} className="bg-white px-4 py-2 rounded-2xl text-xs font-black border border-gray-100 shadow-sm flex items-center gap-2">
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-lg">{item.quantity}x</span>
                          <span className="text-dark">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Receipt and Actions */}
                <div className="flex flex-col sm:flex-row xl:flex-col justify-between gap-6 sm:items-center xl:items-end p-6 bg-gray-50 rounded-[2.5rem] shrink-0 border border-gray-100">
                  <div className="flex gap-4 items-center">
                    {order.paymentScreenshot ? (
                      <button 
                        onClick={() => setPreviewImage(order.paymentScreenshot)}
                        className="group/receipt relative block"
                      >
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border-2 border-white ring-4 ring-green-100/50">
                          <img 
                            src={order.paymentScreenshot} 
                            alt="Receipt" 
                            className="w-full h-full object-cover transition-transform group-hover/receipt:scale-110" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover/receipt:opacity-100 transition-opacity rounded-2xl flex flex-col items-center justify-center">
                          <Eye className="text-white mb-1" size={16} />
                          <span className="text-[8px] text-white font-black uppercase">Preview</span>
                        </div>
                      </button>
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gray-200 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 gap-1">
                        <span className="text-[10px] font-black uppercase">No Receipt</span>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Total Bill</p>
                      <p className="text-3xl font-black text-primary tracking-tighter">₱{order.total}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">{order.paymentMethod}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 w-full sm:w-48">
                    <div className="flex flex-col gap-2 pt-4">
                      {order.status === 'Pending' && (
                        <div className="text-[10px] font-black text-yellow-600 bg-yellow-100 p-2 rounded-xl text-center uppercase tracking-widest">
                          Awaiting Payment
                        </div>
                      )}
                      {order.status === 'Paid' && (
                        <button 
                          onClick={() => handleStatusChange(order.id, 'Processing')}
                          className="bg-dark text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95"
                        >
                          Process Order
                        </button>
                      )}
                      {order.status === 'Processing' && (
                        <button 
                          onClick={() => handleStatusChange(order.id, 'Ready to Pickup')}
                          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                        >
                          Ready to Pickup
                        </button>
                      )}
                      {order.status === 'Ready to Pickup' && (
                        <button 
                          onClick={() => handleStatusChange(order.id, 'Completed')}
                          className="bg-green-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg active:scale-95"
                        >
                          Mark Collected
                        </button>
                      )}
                      {order.status === 'Paid' && (
                        <button 
                          onClick={() => handleStatusChange(order.id, 'Cancelled')}
                          className="text-gray-400 hover:text-red-500 text-[10px] font-black uppercase tracking-widest py-2"
                        >
                          Decline Transaction
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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

export default AdminDashboard;