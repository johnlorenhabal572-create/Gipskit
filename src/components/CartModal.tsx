import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CartModal = ({ isOpen, onClose }) => {
  const { cart, getCartTotal, removeFromCart } = useContext(CartContext) as any; 
  const { user } = useContext(AuthContext) as any;
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (cart.length > 0) {
      onClose();
      if (!user) {
        navigate('/login', { state: { from: { pathname: '/checkout' } } });
      } else {
        navigate('/checkout');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Cart Drawer */}
          <motion.aside 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full bg-white w-full max-w-md shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 flex justify-between items-center border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl text-primary">
                  <ShoppingBag size={24} />
                </div>
                <h2 className="text-2xl font-bold text-dark tracking-tight">Your Cart</h2>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                    <ShoppingBag size={40} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-dark">Your cart is empty</p>
                    <p className="text-gray-400 text-sm">Add some delicious items to get started!</p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="text-primary font-bold hover:underline"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map((item, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={item.id} 
                    className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                      <img 
                        src={item.image = '/images/image copy.png'} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-dark leading-tight mb-1">{item.name}</p>
                      <p className="text-sm text-gray-400 font-medium">Qty: {item.quantity}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-primary mb-2">₱{item.price * item.quantity}</p>
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Total Amount</span>
                <span className="text-3xl font-bold text-dark tracking-tighter">₱{getCartTotal()}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-primary text-white py-5 rounded-2xl hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold text-lg shadow-lg shadow-primary/20 transition-all transform active:scale-95 flex items-center justify-center gap-3"
              >
                Proceed to Checkout
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartModal;