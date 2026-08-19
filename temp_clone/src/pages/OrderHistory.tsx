import { useState, useEffect, useContext } from 'react';
import { getOrders } from '../api/orderService';
import { AuthContext } from '../context/AuthContext';

const OrderHistory = () => {
  const { user } = useContext(AuthContext) as any;
  const [myOrders, setMyOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    // Staff/Admin see all orders in the system
    setMyOrders(getOrders());
  }, []);

  // Apply Search and Filter logic
  const filteredOrders = myOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">My Order History</h1>
      
      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex flex-col md:flex-row gap-4">
        <input 
          type="text" 
          placeholder="Search by Order ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border border-gray-300 p-2 rounded focus:outline-none focus:border-primary"
        />
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 p-2 rounded focus:outline-none focus:border-primary font-medium"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Order List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredOrders.length === 0 ? (
          <p className="text-gray-500 p-6 text-center bg-gray-50">No orders found matching your criteria.</p>
        ) : (
          <div className="divide-y">
            {filteredOrders.map(order => (
              <div key={order.id} className="p-4 hover:bg-gray-50 transition flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <p className="font-mono text-sm text-gray-500 mb-1">{order.id}</p>
                  <p className="font-bold text-primary text-lg">₱{order.total}</p>
                  <p className="text-sm text-gray-500">Ordered on: {new Date(order.date).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`py-1 px-3 rounded-full text-xs font-bold border ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-800 border-green-300' :
                    order.status === 'Cancelled' ? 'bg-red-100 text-red-800 border-red-300' :
                    order.status === 'Processing' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    'bg-yellow-100 text-yellow-800 border-yellow-300'
                  }`}>
                    {order.status}
                  </span>
                  <p className="text-xs text-gray-500">{order.items.length} item(s)</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;