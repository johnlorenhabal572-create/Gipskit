import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Save, X, User, Shield, Briefcase, Mail, Key } from 'lucide-react';

const AccountManagement = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, user: currentUser } = useContext(AuthContext) as any;
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin'
  });

  const handleAdd = () => {
    if (!formData.name || !formData.email || !formData.password) return;
    addAccount(formData);
    resetForm();
    setIsAdding(false);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      updateAccount(editingId, formData);
      setEditingId(null);
      resetForm();
    }
  };

  const handleStartEdit = (acc: any) => {
    setEditingId(acc.id);
    setFormData({
      name: acc.name,
      email: acc.email,
      password: acc.password,
      role: acc.role
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'admin'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
          <div>
            <h1 className="text-4xl font-black text-dark tracking-tighter">USERS ACCOUNT</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Gip's Kitchen Identity Manager</p>
          </div>
          <button 
            onClick={() => { setIsAdding(true); resetForm(); }}
            className="w-full md:w-auto bg-dark text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-primary transition-all active:scale-95 group"
          >
            <div className="bg-white/20 p-1.5 rounded-full group-hover:bg-white group-hover:text-primary transition-all">
              <Plus size={16} />
            </div>
            Create New Account
          </button>
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {(isAdding || editingId) && (
            <div className="fixed inset-0 bg-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-white"
              >
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white">
                  <h2 className="text-xl font-black text-dark tracking-tight">{editingId ? 'EDIT ACCOUNT' : 'NEW ACCOUNT'}</h2>
                  <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="w-10 h-10 bg-gray-50 text-gray-400 hover:text-primary rounded-full flex items-center justify-center transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={18} />
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold text-dark"
                        placeholder="Juan Dela Cruz"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={18} />
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold text-dark"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative group">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={18} />
                      <input 
                        type="text" 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold text-dark"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Security Rank</label>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setFormData({...formData, role: 'admin'})}
                        className={`w-full py-4 rounded-2xl text-[10px] font-black tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${formData.role === 'admin' ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}
                      >
                        <Shield size={14} /> ADMINISTRATOR
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                  <button 
                    onClick={() => { setIsAdding(false); setEditingId(null); }}
                    className="flex-1 bg-white border border-gray-200 text-dark py-4 rounded-[2rem] font-black text-[10px] tracking-widest hover:bg-gray-100 transition-all"
                  >
                    DISCARD
                  </button>
                  <button 
                    onClick={editingId ? handleSaveEdit : handleAdd}
                    className="flex-1 bg-dark text-white py-4 rounded-[2rem] font-black text-[10px] tracking-widest shadow-xl hover:bg-primary transition-all"
                  >
                    {editingId ? 'APPLY CHANGES' : 'AUTHORIZE ACCOUNT'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Accounts List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {accounts.map((acc: any) => (
            <div key={acc.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl border-2 ${acc.role === 'admin' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                  {acc.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-dark tracking-tight leading-none">{acc.name}</h3>
                    {currentUser?.email === acc.email && (
                      <span className="text-[8px] bg-dark text-white px-2 py-0.5 rounded-full uppercase font-black tracking-widest">Master</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-400 mt-1">{acc.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                <div className="flex flex-col items-end">
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-1 ${acc.role === 'admin' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                    {acc.role}
                  </span>
                  <span className="text-[10px] font-mono text-gray-300 font-bold tracking-widest">••••••••</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleStartEdit(acc)}
                    className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all shadow-sm active:scale-90"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => deleteAccount(acc.id)}
                    disabled={currentUser?.email === acc.email}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 ${currentUser?.email === acc.email ? 'bg-gray-50 text-gray-200 cursor-not-allowed' : 'bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountManagement;
