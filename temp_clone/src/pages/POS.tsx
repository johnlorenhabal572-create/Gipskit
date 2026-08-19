import { useState, useEffect, useContext } from 'react';
import { getProducts } from '../api/productService';
import { saveOrder } from '../api/orderService';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Minus, Trash2, CheckCircle2, User, CreditCard, Menu as MenuIcon, RefreshCw, XCircle, ShoppingCart } from 'lucide-react';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [posCart, setPosCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { user } = useContext(AuthContext) as any;
  const { showNotification } = useContext(CartContext) as any;

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const categories = ['All', ...new Set(products.map((p: any) => p.category))];

  const filteredProducts = products.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchLower);
    const matchesCategory = p.category === selectedCategory || selectedCategory === 'All';
    return matchesSearch && matchesCategory;
  });

  const addToPosCart = (product) => {
    const existing = posCart.find(item => item.id === product.id);
    if (existing) {
      setPosCart(posCart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setPosCart([...posCart, { ...product, quantity: 1 }]);
    }
    showNotification(`${product.name} added to order!`);
  };

  const removeFromPosCart = (productId) => {
    setPosCart(posCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setPosCart(posCart.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);

  const total = posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleConfirmOrder = () => {
    if (posCart.length === 0) return;
    
    const orderData = {
      items: posCart,
      total: total,
      status: 'Completed',
      customer: {
        name: customerName || 'Walk-in Customer',
        email: 'pos@gipskitchen.com',
        phone: 'N/A',
        address: 'Dine-in / POS'
      },
      userEmail: user?.email || 'staff@gipskitchen.com'
    };

    saveOrder(orderData);
    setIsSuccess(true);
    setPosCart([]);
    setCustomerName('');
    setIsOrderPanelOpen(false);
    
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left Side: Product Selection */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100">
            <h1 className="text-xl font-bold text-dark hidden sm:block">Point of Sale</h1>
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary bg-gray-50 text-sm font-medium"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="bg-white p-4 flex gap-3 overflow-x-auto scrollbar-hide border-b border-gray-100 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 sm:px-8 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat === 'Supplement' ? 'Supplements' : cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.map(product => {
                const isAvailable = product.status !== 'Not Available';
                return (
                  <div
                    key={product.id}
                    className={`bg-white p-2 sm:p-3 rounded-2xl border border-gray-100 shadow-sm transition-all flex flex-col items-center group relative ${!isAvailable ? 'opacity-60 grayscale-[0.5]' : 'hover:shadow-md'}`}
                  >
                    <div className="w-full aspect-square mb-2 sm:mb-3 overflow-hidden rounded-xl bg-gray-50 relative">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        referrerPolicy="no-referrer" 
                      />
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="bg-white text-red-600 text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold text-dark text-center leading-tight mb-1 line-clamp-2 h-8">{product.name}</p>
                    <p className="text-primary font-bold text-xs sm:text-sm mb-2">₱{product.price}</p>
                    
                    <button
                      onClick={() => isAvailable && addToPosCart(product)}
                      disabled={!isAvailable}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                        isAvailable 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-110 active:scale-95' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile View Cart Button */}
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <button 
            onClick={() => setIsOrderPanelOpen(true)}
            className="bg-primary text-white p-4 rounded-full shadow-2xl flex items-center gap-2 relative"
          >
            <ShoppingCart size={24} />
            {posCart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-dark text-white text-[10px] font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
                {posCart.length}
              </span>
            )}
          </button>
        </div>

        {/* Right Side: Order Panel (Desktop and Mobile Overlay) */}
        <div className={`
          fixed inset-0 lg:relative lg:inset-auto z-50 lg:z-10 w-full lg:w-[400px] bg-white flex flex-col shadow-2xl border-l border-gray-100 transition-transform duration-300
          ${isOrderPanelOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-dark flex items-center gap-2">
              <CreditCard size={20} className="text-primary" />
              Current Order
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full uppercase tracking-widest">
                {posCart.length} Items
              </span>
              <button onClick={() => setIsOrderPanelOpen(false)} className="lg:hidden p-2 text-gray-400">
                <XCircle size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                  <th className="p-4">Item</th>
                  <th className="p-4 text-center">Qty</th>
                  <th className="p-4 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {posCart.map(item => (
                  <tr key={item.id} className="border-b border-gray-50 group hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-dark text-xs">{item.name}</p>
                      <p className="text-[10px] text-gray-400">₱{item.price} ea</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-primary hover:border-primary transition-all"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-primary hover:border-primary transition-all"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-dark">
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {posCart.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="text-gray-200" size={32} />
                </div>
                <p className="text-gray-400 text-sm font-medium">Select items to start</p>
              </div>
            )}
          </div>

          {/* Footer Area */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4">
            {/* Customer Name Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Type customer name..." 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary bg-white text-sm font-medium"
                />
              </div>
            </div>

            {/* Total Row */}
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex justify-between items-center">
              <span className="text-primary font-bold uppercase tracking-widest text-xs">Total Amount</span>
              <span className="text-dark font-bold text-2xl tracking-tighter">₱{total.toFixed(2)}</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setPosCart([])}
                className="bg-dark text-white py-3.5 rounded-xl font-bold text-sm hover:bg-opacity-90 transition-all active:scale-95"
              >
                Clear
              </button>
              <button 
                onClick={handleConfirmOrder}
                disabled={posCart.length === 0}
                className="bg-primary text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-opacity-90 transition-all active:scale-95 disabled:bg-gray-300 disabled:shadow-none"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 32, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-0 left-1/2 z-50 bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle2 size={24} />
            <span className="font-bold">Order Recorded Successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POS;
