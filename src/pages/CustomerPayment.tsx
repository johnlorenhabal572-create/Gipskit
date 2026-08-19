import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from '../api/orderService';
import { CreditCard, CheckCircle2, XCircle, Eye, User, Phone, MapPin, Facebook } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CustomerPayment = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    const fetchOrders = () => {
      const allOrders = getOrders();
      // Filter orders that are 'On Delivery' and have a payment screenshot (for GCash) or are COD
      const paymentOrders = allOrders.filter(order => 
        order.status === 'On Delivery'
      );
      setOrders(paymentOrders);
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmPayment = (orderId) => {
    updateOrderStatus(orderId, 'Completed');
    setSelectedOrder(null);
    alert("Payment confirmed! Order moved to Transaction History.");
    setOrders(getOrders().filter(order => order.status === 'On Delivery'));
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-3 rounded-2xl text-primary">
          <CreditCard size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Customer Payments</h1>
          <p className="text-gray-500 text-sm font-medium">Verify and confirm customer payments</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard size={32} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Pending Payments</h3>
          <p className="text-gray-500 max-w-xs mx-auto">Orders with "On Delivery" status will appear here for payment verification.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <div 
              key={order.id} 
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{order.id}</span>
                    <h3 className="text-lg font-bold text-gray-800">{order.customer.name}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    order.paymentMethod === 'GCash' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.paymentMethod}
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Amount:</span>
                    <span className="font-bold text-primary">₱{order.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Payment Status:</span>
                    <span className={`font-bold ${order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {order.paymentStatus || 'Pending'}
                    </span>
                  </div>
                </div>

                <button className="w-full bg-gray-50 text-dark py-3 rounded-2xl font-bold group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center gap-2">
                  <Eye size={18} /> View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-800">Payment Verification</h2>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <XCircle size={24} className="text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid md:grid-cols-2 gap-10">
                  {/* Customer Info */}
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Customer Details</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                          <div className="bg-white p-2 rounded-xl shadow-sm text-primary"><User size={20} /></div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Full Name</p>
                            <p className="font-bold text-gray-800">{selectedOrder.customer.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                          <div className="bg-white p-2 rounded-xl shadow-sm text-primary"><Phone size={20} /></div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</p>
                            <p className="font-bold text-gray-800">{selectedOrder.customer.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                          <div className="bg-white p-2 rounded-xl shadow-sm text-primary"><Facebook size={20} /></div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Facebook</p>
                            <p className="font-bold text-gray-800">{selectedOrder.customer.facebook}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                          <div className="bg-white p-2 rounded-xl shadow-sm text-primary"><MapPin size={20} /></div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Address & Landmark</p>
                            <p className="font-bold text-gray-800">{selectedOrder.customer.address}</p>
                            <p className="text-xs text-gray-500 italic">Landmark: {selectedOrder.customer.landmark}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-dark p-6 rounded-3xl text-white">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-60">Order Total</span>
                        <span className="text-2xl font-bold text-primary">₱{selectedOrder.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-60">Payment Method</span>
                        <span className="font-bold">{selectedOrder.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Proof */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Payment Proof</h3>
                    {selectedOrder.paymentMethod === 'GCash' ? (
                      selectedOrder.paymentScreenshot ? (
                        <div className="space-y-4">
                          <div className="rounded-3xl overflow-hidden border-4 border-gray-100 shadow-lg aspect-[9/16] max-h-[500px] mx-auto bg-gray-50">
                            <img src={selectedOrder.paymentScreenshot} alt="Payment Proof" className="w-full h-full object-contain" />
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                          <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 font-bold">No screenshot uploaded yet.</p>
                        </div>
                      )
                    ) : (
                      <div className="bg-yellow-50 rounded-3xl p-12 text-center border border-yellow-100">
                        <CreditCard size={48} className="text-yellow-400 mx-auto mb-4" />
                        <h4 className="text-xl font-bold text-yellow-900 mb-2">Cash on Delivery</h4>
                        <p className="text-yellow-700 text-sm">Collect ₱{selectedOrder.total} from the customer upon delivery.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t bg-gray-50 flex gap-4">
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 bg-white text-gray-500 py-4 rounded-2xl font-bold border border-gray-200 hover:bg-gray-100 transition-all"
                >
                  Close
                </button>
                <button 
                  onClick={() => handleConfirmPayment(selectedOrder.id)}
                  className="flex-[2] bg-primary text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <CheckCircle2 size={20} /> Confirm Payment & Complete Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AlertCircle = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);

export default CustomerPayment;
