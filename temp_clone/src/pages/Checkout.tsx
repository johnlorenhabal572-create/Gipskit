import { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { saveOrder } from '../api/orderService';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useContext(CartContext) as any;
  const { user } = useContext(AuthContext) as any;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Your cart is empty!");

    const orderDetails = {
      customer: formData,
      userEmail: user ? user.email : 'anonymous', // Record email if logged in
      items: cart,
      total: getCartTotal(),
      date: new Date().toISOString(),
    };

    const savedOrder = saveOrder(orderDetails); 
    
    // Save order ID to local storage for anonymous history tracking
    const myOrderIds = JSON.parse(localStorage.getItem('my_order_ids') || '[]');
    myOrderIds.push(savedOrder.id);
    localStorage.setItem('my_order_ids', JSON.stringify(myOrderIds));

    clearCart(); 
    setFormData({ name: '', address: '', phone: '' });
    alert("Order placed successfully!");
    navigate('/my-orders'); 
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Checkout</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Order Summary</h2>
        {cart.map((item, index) => (
          <div key={index} className="flex justify-between mb-2 text-gray-700">
            <span>{item.name} <span className="text-sm text-gray-500">(x{item.quantity})</span></span>
            <span className="font-semibold">₱{item.price * item.quantity}</span>
          </div>
        ))}
        <div className="border-t mt-4 pt-4 font-bold text-lg flex justify-between text-gray-900">
          <span>Total:</span>
          <span>₱{getCartTotal()}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Shipping Details</h2>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 font-medium">Full Name</label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} /* <-- Added value binding */
            required 
            onChange={handleChange} 
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-primary" 
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 font-medium">Delivery Address</label>
          <input 
            type="text" 
            name="address" 
            value={formData.address} /* <-- Added value binding */
            required 
            onChange={handleChange} 
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-primary" 
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2 font-medium">Phone Number</label>
          <input 
            type="tel" 
            name="phone" 
            value={formData.phone} /* <-- Added value binding */
            required 
            onChange={handleChange} 
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-primary" 
          />
        </div>
        <button type="submit" className="w-full bg-dark text-white py-3 rounded-full hover:bg-primary font-bold transition-all">
          Confirm & Place Order
        </button>
      </form>
    </div>
  );
};

export default Checkout;