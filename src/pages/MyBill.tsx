import { useState, useEffect } from 'react';
import { getOrders, updateOrderPayment, updateOrderStatus } from '../api/orderService';
import { Receipt, QrCode, Upload, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyBill = () => {
  const [bills, setBills] = useState([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBills = () => {
      const allOrders = getOrders();
      const myOrderIds = JSON.parse(localStorage.getItem('my_order_ids') || '[]');
      
      // Filter orders that are 'Pending' and belong to this customer
      const activeBills = allOrders.filter(order => 
        myOrderIds.includes(order.id) && 
        order.status === 'Pending'
      );
      
      setBills(activeBills);
    };

    fetchBills();
    const interval = setInterval(fetchBills, 3000); // Poll for updates
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = (orderId, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploading(orderId);
        // Simulate upload delay
        setTimeout(() => {
          updateOrderPayment(orderId, { 
            paymentScreenshot: reader.result,
            paymentStatus: 'Paid' 
          });
          setUploading(null);
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmOrder = (orderId) => {
    updateOrderStatus(orderId, 'Paid');
    alert("Order confirmed! You can now track it in My Order.");
    navigate('/my-orders');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl py-12">

      {bills.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-16 text-center border-2 border-dashed border-gray-100 shadow-sm">
          <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={48} className="text-gray-200" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No Bills Found</h3>
          <p className="text-gray-400 max-w-xs mx-auto font-medium">Any new orders requiring payment will appear here!</p>
          <button 
            onClick={() => navigate('/menu')}
            className="mt-8 bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            Order Something Delicious
          </button>
        </div>
      ) : (
        <div className="grid gap-8">
          {bills.map(bill => (
            <div key={bill.id} className="bg-white rounded-[3rem] shadow-2xl border border-gray-50 overflow-hidden group hover:border-primary/20 transition-all">
              <div className="bg-dark p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Order Transaction ID</p>
                  <h3 className="text-2xl font-bold font-mono tracking-tighter">{bill.id}</h3>
                  <div className="flex gap-2 mt-2">
                    {bill.items.slice(0, 2).map((item, i) => (
                      <span key={i} className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/80">{item.name}</span>
                    ))}
                    {bill.items.length > 2 && <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/80">+{bill.items.length - 2} more</span>}
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Payable Amount</p>
                  <h3 className="text-4xl font-black text-primary tracking-tighter">₱{bill.total}</h3>
                </div>
              </div>

              <div className="p-10">
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 flex flex-col items-center shadow-inner">
                      <div className="flex items-center gap-3 mb-6 text-blue-700 w-full justify-center underline decoration-blue-200 underline-offset-8 decoration-2">
                        <QrCode size={24} />
                        <h4 className="text-xl font-bold uppercase tracking-tight">GIP'S KITCHEN GCash</h4>
                      </div>
                      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl mb-6 flex justify-center border-4 border-blue-100 group-hover:scale-105 transition-transform">
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Gcash:09123456789" 
                          alt="GCash QR Code" 
                          className="w-56 h-56 object-contain"
                        />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Account Name</p>
                        <p className="text-xl font-black text-blue-900">GIP'S KITCHEN</p>
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest pt-3">Account Number</p>
                        <p className="text-3xl font-black text-blue-700 tracking-tighter">0912 345 6789</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                          <Upload size={20} />
                        </div>
                        <h4 className="text-xl font-bold text-dark">Proof of Payment</h4>
                      </div>
                      
                      {bill.paymentScreenshot ? (
                        <div className="space-y-6">
                          <div className="relative rounded-[2rem] overflow-hidden border-8 border-green-50 shadow-2xl aspect-[4/5] max-h-80 mx-auto">
                            <img src={bill.paymentScreenshot} alt="Receipt" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-sm">
                              <div className="bg-white p-4 rounded-full shadow-lg">
                                <CheckCircle2 size={48} className="text-green-500" />
                              </div>
                            </div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-2xl flex items-center gap-3 text-green-700 border border-green-100 font-bold text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                            Receipt uploaded successfully!
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <p className="text-gray-500 font-medium text-sm leading-relaxed">
                            To process your order, please upload a <span className="text-dark font-bold">Screenshot</span> of your GCash payment receipt.
                          </p>
                          <label className={`
                            flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all
                            ${uploading === bill.id ? 'bg-gray-50 border-gray-300' : 'bg-gray-50 border-gray-200 hover:border-primary hover:bg-primary/5'}
                          `}>
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                              {uploading === bill.id ? (
                                <div className="space-y-4 flex flex-col items-center">
                                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2 border-gray-200"></div>
                                  <p className="text-sm font-bold text-gray-500">Processing image...</p>
                                </div>
                              ) : (
                                <>
                                  <div className="bg-white p-4 rounded-full shadow-sm mb-4 text-gray-300">
                                    <Upload size={32} />
                                  </div>
                                  <p className="text-dark font-bold text-lg mb-1">Drop your receipt here</p>
                                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">PNG, JPG or JPEG from your device</p>
                                </>
                              )}
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(bill.id, e)} disabled={uploading === bill.id} />
                          </label>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-10">
                      <button 
                        onClick={() => handleConfirmOrder(bill.id)}
                        disabled={!bill.paymentScreenshot}
                        className={`
                          w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3
                          ${bill.paymentScreenshot 
                            ? 'bg-primary text-white hover:bg-opacity-90 active:scale-95 shadow-primary/30' 
                            : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'}
                        `}
                      >
                        Confirm Payment
                      </button>
                      <p className="text-[10px] text-gray-400 font-bold text-center mt-4 uppercase tracking-[0.2em]">Please review details before confirming</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBill;
