import { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { saveOrder } from '../api/orderService';
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Your cart is empty!");

    const orderDetails = {
      customer: formData,
      userEmail: user ? user.email : 'anonymous',
      userName: user ? user.name : formData.name,
      items: [...cart],
      total: getCartTotal(),
      date: new Date().toISOString(),
      paymentMethod: formData.paymentMethod,
      status: 'Pending',
      paymentStatus: 'Unpaid'
    };

    const savedOrder = saveOrder(orderDetails); 
    
    // Save order ID to local storage for history tracking
    const myOrderIds = JSON.parse(localStorage.getItem('my_order_ids') || '[]');
    myOrderIds.push(savedOrder.id);
    localStorage.setItem('my_order_ids', JSON.stringify(myOrderIds));

    clearCart(); 
    setFormData({ 
      name: '', 
      phone: '',
      paymentMethod: 'GCash'
    });
    alert("Order placed successfully! Please proceed to My Bill for payment.");
    navigate('/my-bill'); 
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl py-12">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-black text-dark tracking-tighter">CHECKOUT</h1>
      </div>
      
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-50 mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
          Order Summary
        </h2>
        <div className="space-y-4">
          {cart.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-dark">
              <div className="flex flex-col">
                <span className="font-bold">{item.name}</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty: {item.quantity}</span>
              </div>
              <span className="font-black text-primary">₱{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-gray-100 mt-6 pt-6 flex justify-between items-end">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grand Total</span>
          <span className="text-3xl font-black text-dark tracking-tighter">₱{getCartTotal()}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-50 space-y-8">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
          Personal Details
        </h2>
        
        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name}
              placeholder="Enter your full name"
              required 
              onChange={handleChange} 
              className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold text-dark" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
            <input 
              type="tel" 
              name="phone" 
              value={formData.phone}
              placeholder="eg. 0912 345 6789"
              required 
              onChange={handleChange} 
              className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold text-dark" 
            />
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            className="w-full bg-dark text-white py-5 rounded-[2rem] font-black text-lg hover:bg-primary transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
          >
            Confirm & Place Order
          </button>
          <p className="text-[10px] text-gray-400 font-bold text-center mt-6 uppercase tracking-[0.2em]">Default payment method: GCash</p>
        </div>
      </form>
    </div>
  );
};

export default Checkout;