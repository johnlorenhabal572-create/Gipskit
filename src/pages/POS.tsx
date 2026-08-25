import { useState, useEffect, useContext } from 'react';
import { fetchProducts, CATEGORIES } from '../api/productService';
import { createOrder, fetchSalesSummary } from '../api/orderService';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, Minus, Trash2, CheckCircle2, User, CreditCard, 
  XCircle, ShoppingCart, Receipt, DollarSign, Wallet, 
  Printer, ArrowRight, FileText, BarChart3, RefreshCw
} from 'lucide-react';

const POS = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [posCart, setPosCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'GCash' | 'Card'>('Cash');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  
  // Receipt Modal State
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  
  // End of Shift Report Modal
  const [isShiftReportOpen, setIsShiftReportOpen] = useState(false);
  const [shiftReportData, setShiftReportData] = useState<any | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);

  const { user } = useContext(AuthContext) as any;
  const { showNotification } = useContext(CartContext) as any;

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error('POS failed to load products:', err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = ['All', ...CATEGORIES];

  const filteredProducts = products.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchLower);
    const matchesCategory = p.category === selectedCategory || selectedCategory === 'All';
    return matchesSearch && matchesCategory;
  });

  const addToPosCart = (product: any) => {
    const existing = posCart.find(item => item.id === product.id);
    const qtyInCart = existing ? existing.quantity : 0;

    if (qtyInCart >= product.stock) {
      showNotification(`Limited quantity: only ${product.stock} left.`);
      return;
    }

    if (existing) {
      setPosCart(posCart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setPosCart([...posCart, { ...product, quantity: 1 }]);
    }
    showNotification(`${product.name} added to order!`);
  };

  const removeFromPosCart = (productId: any) => {
    setPosCart(posCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: any, delta: number) => {
    setPosCart(posCart.map(item => {
      if (item.id === productId) {
        let newQty = item.quantity + delta;
        
        if (delta > 0 && newQty > item.stock) {
          showNotification(`Maximum available quantity reached (${item.stock}).`);
          return item;
        }

        if (newQty <= 0) {
          return null;
        }

        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as any[]);
  };

  const subtotal = posCart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const total = subtotal; // Can add tax or discounts if needed

  // Payment calculations
  const parsedAmountPaid = parseFloat(amountPaidInput) || 0;
  const change = Math.max(0, parsedAmountPaid - total);
  const isAmountSufficient = paymentMethod !== 'Cash' || parsedAmountPaid >= total;

  const handleOpenPayment = () => {
    if (posCart.length === 0) return;
    setAmountPaidInput(total.toString());
    setIsPaymentModalOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (posCart.length === 0 || isProcessing) return;
    setIsProcessing(true);
    
    const finalAmountPaid = paymentMethod === 'Cash' ? (parsedAmountPaid || total) : total;
    const finalChange = paymentMethod === 'Cash' ? change : 0;

    const orderData = {
      items: posCart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        inventoryLinkId: item.inventoryLinkId || null,
        image: item.image || '',
        category: item.category || ''
      })),
      subtotal: subtotal,
      total: total,
      amountPaid: finalAmountPaid,
      change: finalChange,
      paymentMethod: paymentMethod,
      paymentStatus: 'Paid',
      status: 'Completed',
      orderType: 'POS',
      customer: {
        name: customerName.trim() || (tableNumber ? `Table #${tableNumber}` : 'Walk-in Customer'),
        phone: customerPhone.trim() || 'N/A',
        address: tableNumber ? `Table ${tableNumber}` : 'Dine-in / Counter',
        email: 'pos@gipskitchen.com'
      },
      userEmail: user?.email || 'admin@gipskitchen.com',
      userName: user?.name || 'Staff'
    };

    try {
      const savedOrder = await createOrder(orderData);
      setCompletedOrder(savedOrder);
      setIsSuccess(true);
      setPosCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setTableNumber('');
      setIsPaymentModalOpen(false);
      setIsOrderPanelOpen(false);
      
      // Refresh products to update live stock numbers
      await loadProducts();

      setTimeout(() => setIsSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to submit POS order:', err);
      alert('Failed to process order. Please check database connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenShiftReport = async () => {
    setLoadingReport(true);
    setIsShiftReportOpen(true);
    try {
      const data = await fetchSalesSummary('day', new Date());
      setShiftReportData(data);
    } catch (err) {
      console.error('Failed to load shift report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left Side: Product Catalog */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Bar */}
          <div className="bg-white p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                POS
              </div>
              <div>
                <h1 className="text-xl font-black text-dark tracking-tight">Point of Sale</h1>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Fast Counter & Dine-in Billing</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search item or barcode..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50 text-xs font-bold"
                />
              </div>

              <button
                onClick={handleOpenShiftReport}
                className="px-3.5 py-2 bg-dark text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-black transition-all shrink-0"
                title="End of Shift Sales Report"
              >
                <BarChart3 size={15} />
                <span className="hidden sm:inline">Shift Report</span>
              </button>

              <button
                onClick={loadProducts}
                className="p-2 bg-gray-100 text-gray-600 hover:text-dark rounded-xl transition-all shrink-0"
                title="Refresh menu stock"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="bg-white px-4 py-3 flex gap-2 overflow-x-auto border-b border-gray-100 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedCategory === cat 
                    ? 'bg-primary text-white shadow-md shadow-primary/20' 
                    : 'bg-gray-50 text-gray-400 hover:text-dark hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.map(product => {
                const isAvailable = product.status !== 'Not Available' && (product.stock > 0);
                const inCart = posCart.find(i => i.id === product.id);

                return (
                  <div
                    key={product.id}
                    onClick={() => isAvailable && addToPosCart(product)}
                    className={`bg-white p-3 rounded-2xl border border-gray-100 shadow-sm transition-all flex flex-col justify-between group relative cursor-pointer select-none ${
                      !isAvailable ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-primary/40 hover:shadow-md active:scale-[0.98]'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 z-10 bg-dark text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                        {inCart.quantity}
                      </span>
                    )}

                    <div className="w-full aspect-square mb-3 overflow-hidden rounded-xl bg-gray-50 relative">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        referrerPolicy="no-referrer" 
                      />
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="bg-red-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-dark line-clamp-1 mb-1">{product.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-black text-sm">₱{Number(product.price).toFixed(2)}</span>
                        <span className={`text-[9px] font-bold uppercase ${product.stock <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                          Stock: {product.stock}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile View Cart Trigger */}
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <button 
            onClick={() => setIsOrderPanelOpen(true)}
            className="bg-primary text-white p-4 rounded-full shadow-2xl flex items-center gap-2 relative active:scale-95"
          >
            <ShoppingCart size={24} />
            {posCart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-dark text-white text-[10px] font-black rounded-full h-6 w-6 flex items-center justify-center border-2 border-white shadow">
                {posCart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Right Side: POS Order Sidebar */}
        <div className={`
          fixed inset-0 lg:relative lg:inset-auto z-50 lg:z-10 w-full lg:w-[420px] bg-white flex flex-col shadow-2xl border-l border-gray-100 transition-transform duration-300
          ${isOrderPanelOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Receipt size={18} />
              </div>
              <h2 className="text-base font-black text-dark tracking-tight">Active Bill</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {posCart.reduce((sum, i) => sum + i.quantity, 0)} Items
              </span>
              <button onClick={() => setIsOrderPanelOpen(false)} className="lg:hidden p-1.5 text-gray-400 hover:text-dark">
                <XCircle size={22} />
              </button>
            </div>
          </div>

          {/* Customer / Table Inputs */}
          <div className="p-4 bg-white border-b border-gray-100 grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-1">Customer Name</label>
              <input 
                type="text"
                placeholder="Walk-in / Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-gray-50 border-none outline-none focus:ring-1 focus:ring-primary text-dark"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-1">Table # (Optional)</label>
              <input 
                type="text"
                placeholder="e.g. 05"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-gray-50 border-none outline-none focus:ring-1 focus:ring-primary text-dark"
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {posCart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-300">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-200">
                  <ShoppingCart size={32} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Order is empty</p>
                <p className="text-[11px] text-gray-400 mt-1">Tap menu items to add them to this bill</p>
              </div>
            ) : (
              posCart.map(item => (
                <div key={item.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-dark truncate">{item.name}</p>
                    <p className="text-[10px] text-primary font-black">₱{Number(item.price).toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-primary hover:border-primary transition-all active:scale-95"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-black w-5 text-center text-dark">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-primary hover:border-primary transition-all active:scale-95"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="text-right shrink-0 min-w-[60px]">
                    <p className="text-xs font-black text-dark">₱{(item.price * item.quantity).toFixed(2)}</p>
                    <button 
                      onClick={() => removeFromPosCart(item.id)}
                      className="text-[9px] text-red-500 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Totals and Checkout */}
          <div className="p-5 bg-white border-t border-gray-100 space-y-4">
            <div className="space-y-1.5 text-xs font-bold">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-dark pt-2 border-t border-dashed border-gray-200">
                <span className="text-sm font-black uppercase tracking-wider">Grand Total</span>
                <span className="text-2xl font-black text-primary">₱{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setPosCart([])}
                disabled={posCart.length === 0}
                className="py-3 bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40"
              >
                Clear
              </button>
              <button 
                onClick={handleOpenPayment}
                disabled={posCart.length === 0}
                className="col-span-2 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
              >
                <CreditCard size={16} />
                <span>Pay ₱{total.toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-dark tracking-tight">Select Payment</h3>
                  <p className="text-xs text-gray-400 font-bold">Total Payable: ₱{total.toFixed(2)}</p>
                </div>
                <button onClick={() => setIsPaymentModalOpen(false)} className="p-1.5 text-gray-400 hover:text-dark">
                  <XCircle size={22} />
                </button>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { id: 'Cash', label: 'Cash', icon: DollarSign },
                  { id: 'GCash', label: 'GCash', icon: Wallet },
                  { id: 'Card', label: 'Debit/Card', icon: CreditCard }
                ].map(m => {
                  const Icon = m.icon;
                  const active = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setPaymentMethod(m.id as any);
                        if (m.id !== 'Cash') setAmountPaidInput(total.toString());
                      }}
                      className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                        active 
                          ? 'border-primary bg-primary/5 text-primary font-black shadow-sm' 
                          : 'border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-xs font-black">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cash Tendered Calculation */}
              {paymentMethod === 'Cash' && (
                <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Cash Tendered (₱)</label>
                    <input 
                      type="number"
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(e.target.value)}
                      placeholder="Enter amount given"
                      className="w-full px-4 py-3 bg-white text-lg font-black text-dark rounded-xl border border-gray-200 outline-none focus:border-primary"
                    />
                  </div>

                  {/* Cash Preset Shortcuts */}
                  <div className="flex flex-wrap gap-2">
                    {[total, 100, 200, 500, 1000].map(val => (
                      <button
                        key={val}
                        onClick={() => setAmountPaidInput(val.toString())}
                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:border-primary hover:text-primary rounded-lg text-xs font-bold transition-all"
                      >
                        {val === total ? 'Exact' : `₱${val}`}
                      </button>
                    ))}
                  </div>

                  {/* Change Computation */}
                  <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-gray-400">Change Due:</span>
                    <span className={`text-xl font-black ${parsedAmountPaid >= total ? 'text-green-600' : 'text-red-500'}`}>
                      ₱{change.toFixed(2)}
                    </span>
                  </div>
                  {parsedAmountPaid < total && (
                    <p className="text-[10px] text-red-500 font-bold">Amount tendered is less than total bill.</p>
                  )}
                </div>
              )}

              {paymentMethod === 'GCash' && (
                <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-2xl text-xs font-bold flex items-center gap-3">
                  <Wallet className="shrink-0" size={24} />
                  <div>
                    <p>GCash QR / Number: <strong>0912-345-6789</strong></p>
                    <p className="text-[10px] opacity-80 mt-0.5">Payment will be recorded automatically as Paid.</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleConfirmOrder}
                disabled={!isAmountSufficient || isProcessing}
                className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-wider shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
              >
                {isProcessing ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Complete Order & Print Receipt</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Completed Order Receipt Modal */}
      <AnimatePresence>
        {completedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 font-mono text-xs"
            >
              <div className="text-center pb-4 border-b border-dashed border-gray-300">
                <h2 className="text-lg font-black tracking-tight text-dark font-sans">GIP'S KITCHEN</h2>
                <p className="text-[10px] text-gray-500 font-sans">Official Sales Receipt</p>
                <p className="text-[10px] text-gray-400 mt-1">Ref: {completedOrder.id}</p>
                <p className="text-[10px] text-gray-400">{new Date(completedOrder.date || completedOrder.createdAt).toLocaleString()}</p>
              </div>

              <div className="py-4 space-y-2 border-b border-dashed border-gray-300">
                <div className="flex justify-between font-bold text-gray-500 text-[10px] uppercase">
                  <span>Item</span>
                  <span>Total</span>
                </div>
                {completedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-dark">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-bold">₱{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="py-3 space-y-1.5 border-b border-dashed border-gray-300">
                <div className="flex justify-between font-bold text-dark">
                  <span>Grand Total:</span>
                  <span>₱{Number(completedOrder.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Payment Method:</span>
                  <span>{completedOrder.paymentMethod}</span>
                </div>
                {completedOrder.amountPaid > 0 && (
                  <>
                    <div className="flex justify-between text-gray-500">
                      <span>Amount Paid:</span>
                      <span>₱{Number(completedOrder.amountPaid).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-green-600">
                      <span>Change:</span>
                      <span>₱{Number(completedOrder.change || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 flex gap-2 font-sans">
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 py-2.5 bg-dark text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-black"
                >
                  <Printer size={15} />
                  Print
                </button>
                <button
                  onClick={() => setCompletedOrder(null)}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90"
                >
                  Next Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* End-of-Shift / Daily Sales Report Drawer */}
      <AnimatePresence>
        {isShiftReportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-dark tracking-tight">End-of-Shift Sales</h3>
                  <p className="text-xs text-gray-400 font-bold">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <button onClick={() => setIsShiftReportOpen(false)} className="p-1.5 text-gray-400 hover:text-dark">
                  <XCircle size={22} />
                </button>
              </div>

              {loadingReport ? (
                <div className="py-12 text-center text-gray-400 font-bold text-sm">
                  Loading shift report...
                </div>
              ) : shiftReportData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
                      <p className="text-[10px] font-black text-primary uppercase tracking-wider">Total Sales Today</p>
                      <p className="text-2xl font-black text-dark mt-1">₱{Number(shiftReportData.totalRevenue || 0).toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Transactions</p>
                      <p className="text-2xl font-black text-dark mt-1">{shiftReportData.transactionCount || 0}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Payment Breakdown</p>
                    {Object.entries(shiftReportData.paymentMethods || {}).map(([method, amt]: any) => (
                      <div key={method} className="flex justify-between text-xs font-bold text-dark">
                        <span>{method}</span>
                        <span>₱{Number(amt).toFixed(2)}</span>
                      </div>
                    ))}
                    {Object.keys(shiftReportData.paymentMethods || {}).length === 0 && (
                      <p className="text-xs text-gray-400">No completed transactions today.</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="w-full py-3.5 bg-dark text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-black transition-all"
                  >
                    <Printer size={16} />
                    Print Shift Summary
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-6">No shift data available.</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 32, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-0 left-1/2 z-50 bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-sm"
          >
            <CheckCircle2 size={20} />
            <span>Order Completed & Inventory Synced!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POS;
