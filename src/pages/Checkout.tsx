import { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { createOrder } from '../api/orderService';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useContext(CartContext) as any;
  const { user } = useContext(AuthContext) as any;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    name: user?.name || '', 
    phone: '',
    paymentMethod: 'GCash'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Your cart is empty!");
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const orderDetails = {
        customer: formData,
        userEmail: user ? user.email : 'anonymous',
        userName: user ? user.name : formData.name,
        items: [...cart],
        total: getCartTotal(),
        date: new Date().toISOString(),
        paymentMethod: formData.paymentMethod,
        status: 'Pending',
        paymentStatus: 'Unpaid',
        orderType: 'Online'
      };

      const savedOrder = await createOrder(orderDetails); 
      
      // Save order ID to local storage for history tracking
      const myOrderIds = JSON.parse(localStorage.getItem('my_order_ids') || '[]');
      if (savedOrder?.id) {
        myOrderIds.push(savedOrder.id);
        localStorage.setItem('my_order_ids', JSON.stringify(myOrderIds));
      }

      clearCart(); 
      setFormData({ 
        name: '', 
        phone: '',
        paymentMethod: 'GCash'
      });
      alert("Order placed successfully! Please proceed to My Bill for payment.");
      navigate('/my-bill'); 
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-xl py-8 sm:py-12">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-dark tracking-tight">Checkout</h1>
        <p className="text-xs text-gray-500 mt-1">Review your items and confirm your pickup order</p>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
          Order Summary
        </h2>
        <div className="space-y-3 divide-y divide-gray-100">
          {cart.map((item: any, index: number) => (
            <div key={index} className="flex justify-between items-center text-dark pt-2 first:pt-0">
              <div className="flex flex-col">
                <span className="font-bold text-sm">{item.name}</span>
                <span className="text-xs text-gray-500 font-medium">Qty: {item.quantity} × ₱{item.price}</span>
              </div>
              <span className="font-black text-primary text-sm">₱{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 mt-5 pt-4 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Total Amount</span>
          <span className="text-2xl font-black text-dark tracking-tight">₱{getCartTotal()}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 space-y-5">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-2 border-b border-gray-100">
          Pickup Customer Details
        </h2>
        
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name}
              placeholder="Enter your full name"
              required 
              onChange={handleChange} 
              className="w-full bg-white border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:border-dark transition-colors font-medium text-sm text-dark placeholder:text-gray-400" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Phone Number</label>
            <input 
              type="tel" 
              name="phone" 
              value={formData.phone}
              placeholder="e.g. 0912 345 6789"
              required 
              onChange={handleChange} 
              className="w-full bg-white border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:border-dark transition-colors font-medium text-sm text-dark placeholder:text-gray-400" 
            />
          </div>
        </div>

        <div className="pt-3">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-dark text-white py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-primary transition-colors flex items-center justify-center gap-2 active:translate-y-0.5"
          >
            {isSubmitting ? 'Placing Order...' : 'Confirm & Place Order'}
          </button>
          <p className="text-[11px] text-gray-500 font-medium text-center mt-3">Payment via GCash or In-Store Cash upon Pickup</p>
        </div>
      </form>
    </div>
  );
};

export default Checkout;