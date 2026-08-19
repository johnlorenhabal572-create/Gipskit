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
    role: 'staff'
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
      role: 'staff'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-dark tracking-tight">Account Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage staff and administrator access to the system.</p>
          </div>
          <button 
            onClick={() => { setIsAdding(true); resetForm(); }}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-opacity-90 transition-all active:scale-95"
          >
            <Plus size={20} /> Create Account
          </button>
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {(isAdding || editingId) && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h2 className="text-xl font-bold text-dark">{editingId ? 'Edit Account' : 'Create New Account'}</h2>
                  <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-gray-400 hover:text-primary transition-colors">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                        placeholder="e.g. Juan Dela Cruz"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                        placeholder="Enter password"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Role</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setFormData({...formData, role: 'admin'})}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${formData.role === 'admin' ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-400'}`}
                      >
                        <Shield size={14} /> Admin
                      </button>
                      <button 
                        onClick={() => setFormData({...formData, role: 'staff'})}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${formData.role === 'staff' ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-400'}`}
                      >
                        <Briefcase size={14} /> Staff
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                  <button 
                    onClick={() => { setIsAdding(false); setEditingId(null); }}
                    className="flex-1 bg-white border border-gray-200 text-dark py-3 rounded-xl font-bold hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={editingId ? handleSaveEdit : handleAdd}
                    className="flex-1 bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-opacity-90 transition-all"
                  >
                    {editingId ? 'Save Changes' : 'Create Account'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Accounts List - Desktop Table */}
        <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                <th className="p-6">User</th>
                <th className="p-6">Email</th>
                <th className="p-6">Role</th>
                <th className="p-6">Password</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {accounts.map((acc: any) => (
                <tr key={acc.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${acc.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-600'}`}>
                        {acc.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-dark block">{acc.name}</span>
                        {currentUser?.email === acc.email && (
                          <span className="text-[8px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">You</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-gray-500 text-sm">{acc.email}</span>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${acc.role === 'admin' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                      {acc.role}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className="text-gray-400 font-mono text-xs">••••••••</span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleStartEdit(acc)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => deleteAccount(acc.id)}
                        disabled={currentUser?.email === acc.email}
                        className={`p-2 rounded-lg transition-colors ${currentUser?.email === acc.email ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Accounts List - Mobile Cards */}
        <div className="md:hidden space-y-4">
          {accounts.map((acc: any) => (
            <div key={acc.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${acc.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-600'}`}>
                    {acc.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-dark flex items-center gap-2">
                      {acc.name}
                      {currentUser?.email === acc.email && (
                        <span className="text-[8px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">You</span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500">{acc.email}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleStartEdit(acc)}
                    className="p-2 text-gray-400 hover:text-primary"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => deleteAccount(acc.id)}
                    disabled={currentUser?.email === acc.email}
                    className={`p-2 rounded-lg ${currentUser?.email === acc.email ? 'text-gray-200' : 'text-gray-400 hover:text-red-500'}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${acc.role === 'admin' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                  {acc.role}
                </span>
                <span className="text-gray-400 font-mono text-xs tracking-widest">••••••••</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountManagement;
