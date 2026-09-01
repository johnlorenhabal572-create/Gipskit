import { useState, useEffect, useContext } from 'react';
import { fetchOrders, modifyOrderPayment, modifyOrderStatus } from '../api/orderService';
import { AuthContext } from '../context/AuthContext';
import { Receipt, QrCode, Upload, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyBill = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const { user } = useContext(AuthContext) as any;
  const navigate = useNavigate();

  const loadBills = async () => {
    try {
      const allOrders = await fetchOrders();
      const myOrderIds = JSON.parse(localStorage.getItem('my_order_ids') || '[]');
      
      // Filter orders that are 'Pending' and belong to this customer
      const activeBills = allOrders.filter(order => 
        (myOrderIds.includes(order.id) || (user?.email && order.userEmail === user.email)) && 
        order.status === 'Pending'
      );
      
      setBills(activeBills);
    } catch (err) {
      console.error('Failed to load bills:', err);
    }
  };

  useEffect(() => {
    loadBills();
    const interval = setInterval(loadBills, 4000); // Poll for updates
    return () => clearInterval(interval);
  }, [user]);

  const handleFileUpload = (orderId: string, e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setUploading(orderId);
        try {
          await modifyOrderPayment(orderId, { 
            paymentScreenshot: reader.result,
            paymentStatus: 'Paid' 
          });
          await loadBills();
        } catch (err) {
          console.error('Failed to upload screenshot:', err);
        } finally {
          setUploading(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    await modifyOrderStatus(orderId, 'Paid');
    alert("Order confirmed! You can now track it in My Order.");
    navigate('/my-orders');
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-dark tracking-tight">My Bill</h1>
        <p className="text-xs text-gray-500 mt-1">Settle pending payments for your in-store pickup orders</p>
      </div>

      {bills.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <ShoppingBag size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-dark mb-1">No Pending Bills Found</h3>
          <p className="text-gray-500 text-xs max-w-xs mx-auto font-medium">Any new orders requiring payment will appear here.</p>
          <button 
            onClick={() => navigate('/menu')}
            className="mt-6 bg-primary text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
          >
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {bills.map(bill => (
            <div key={bill.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-dark p-5 sm:p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Order Transaction ID</p>
                  <h3 className="text-xl font-bold font-mono tracking-tight">{bill.id}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {bill.items.slice(0, 3).map((item: any, i: number) => (
                      <span key={i} className="text-[11px] bg-white/10 px-2 py-0.5 rounded text-gray-200 border border-white/10">{item.name}</span>
                    ))}
                    {bill.items.length > 3 && <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded text-gray-200">+{bill.items.length - 3} more</span>}
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Total Due</p>
                  <h3 className="text-3xl font-black text-primary tracking-tight">₱{bill.total}</h3>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="bg-blue-50/60 p-6 rounded-lg border border-blue-200 flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-4 text-blue-900 w-full justify-center">
                        <QrCode size={20} />
                        <h4 className="text-sm font-bold uppercase tracking-wider">Gip's Kitchen GCash</h4>
                      </div>
                      <div className="bg-white p-4 rounded-lg mb-4 flex justify-center border border-blue-200">
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Gcash:09123456789" 
                          alt="GCash QR Code" 
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                      <div className="text-center space-y-0.5">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Account Name</p>
                        <p className="text-base font-black text-blue-950">GIP'S KITCHEN</p>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider pt-2">Account Number</p>
                        <p className="text-2xl font-black text-blue-800 tracking-tight">0912 345 6789</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-gray-100 p-1.5 rounded text-gray-700">
                          <Upload size={16} />
                        </div>
                        <h4 className="text-sm font-bold text-dark uppercase tracking-wider">Proof of Payment</h4>
                      </div>
                      
                      {bill.paymentScreenshot ? (
                        <div className="space-y-4">
                          <div className="relative rounded-lg overflow-hidden border border-green-300 aspect-[4/5] max-h-64 mx-auto bg-gray-50">
                            <img src={bill.paymentScreenshot} alt="Receipt" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-dark/40 flex items-center justify-center">
                              <div className="bg-white p-2 rounded-full">
                                <CheckCircle2 size={32} className="text-green-600" />
                              </div>
                            </div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2 text-green-800 border border-green-200 font-bold text-xs">
                            <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                            Receipt uploaded successfully! Ready to confirm.
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-gray-600 text-xs leading-relaxed">
                            To process your order, please upload a screenshot of your GCash payment confirmation receipt.
                          </p>
                          <label className={`
                            flex flex-col items-center justify-center w-full h-52 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                            ${uploading === bill.id ? 'bg-gray-50 border-gray-300' : 'bg-gray-50 border-gray-300 hover:border-dark hover:bg-gray-100/50'}
                          `}>
                            <div className="flex flex-col items-center justify-center p-5 text-center">
                              {uploading === bill.id ? (
                                <div className="space-y-2 flex flex-col items-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-dark border-t-transparent"></div>
                                  <p className="text-xs font-bold text-gray-600">Processing screenshot...</p>
                                </div>
                              ) : (
                                <>
                                  <div className="bg-white p-2.5 rounded-lg border border-gray-200 mb-3 text-gray-500">
                                    <Upload size={24} />
                                  </div>
                                  <p className="text-dark font-bold text-sm mb-0.5">Click or drag screenshot here</p>
                                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">PNG, JPG or JPEG image</p>
                                </>
                              )}
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(bill.id, e)} disabled={uploading === bill.id} />
                          </label>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <button 
                        onClick={() => handleConfirmOrder(bill.id)}
                        disabled={!bill.paymentScreenshot}
                        className={`
                          w-full py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2
                          ${bill.paymentScreenshot 
                            ? 'bg-dark text-white hover:bg-primary active:translate-y-0.5' 
                            : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'}
                        `}
                      >
                        Confirm Payment
                      </button>
                      <p className="text-[10px] text-gray-400 font-medium text-center mt-2">Please double-check all details before confirming</p>
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
