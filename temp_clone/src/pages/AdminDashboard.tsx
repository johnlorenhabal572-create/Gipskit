import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from '../api/orderService';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending');

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
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-dark tracking-tight">Manage Orders</h1>
            <p className="text-gray-500 text-sm sm:font-medium mt-1">Review, record, and confirm customer orders.</p>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full md:w-auto">
            {['Pending', 'Processing', 'Completed', 'All'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                  filterStatus === status 
                    ? 'bg-dark text-white shadow-lg' 
                    : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 mb-8 flex items-center gap-4">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Search by Order ID or Customer Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-3 rounded-xl border-none focus:ring-0 text-dark font-medium placeholder:text-gray-300"
            />
          </div>
        </div>

        <div className="grid gap-6">
          {filteredOrders.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] shadow-sm border border-gray-100 text-center">
              <p className="text-gray-400 text-lg font-medium">No orders found matching your criteria.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-8 hover:shadow-md transition-all">
                <div className="flex gap-6 items-start">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border ${getStatusColor(order.status)}`}>
                    <span className="font-bold text-xl">#</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-dark">{order.customer.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-gray-400 mb-3 uppercase tracking-tighter">Order ID: {order.id}</p>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="bg-gray-50 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold border border-gray-100">
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-12 border-t lg:border-t-0 pt-6 lg:pt-0">
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-primary tracking-tighter">₱{order.total}</p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Update Status</p>
                    <div className="flex gap-2">
                      {order.status === 'Pending' && (
                        <button 
                          onClick={() => handleStatusChange(order.id, 'Processing')}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
                        >
                          Confirm Order
                        </button>
                      )}
                      {order.status === 'Processing' && (
                        <button 
                          onClick={() => handleStatusChange(order.id, 'Completed')}
                          className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-all"
                        >
                          Mark Completed
                        </button>
                      )}
                      {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                        <button 
                          onClick={() => handleStatusChange(order.id, 'Cancelled')}
                          className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-500 transition-all"
                        >
                          Cancel
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
    </div>
  );
};

export default AdminDashboard;