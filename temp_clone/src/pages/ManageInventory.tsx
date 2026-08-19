import { useState, useEffect } from 'react';
import { getInventory, saveInventory } from '../api/inventoryService';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Save, X, Package, AlertCircle } from 'lucide-react';

const ManageInventory = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, unit: 'pcs', stableQuantity: 0, lowStockThreshold: 10 });
  const [editItem, setEditItem] = useState({ name: '', quantity: 0, unit: 'pcs', stableQuantity: 0, lowStockThreshold: 10 });

  const UNIT_OPTIONS = ['pcs', 'kg', 'pack', 'bottle', 'can', 'box', 'liter', 'ml', 'g'];

  useEffect(() => {
    setInventory(getInventory());
  }, []);

  const handleAdd = () => {
    if (!newItem.name) return;
    const itemToAdd = { 
      ...newItem, 
      id: `inv_${Date.now()}`,
      stableQuantity: newItem.stableQuantity || 0,
      lowStockThreshold: newItem.lowStockThreshold || 10
    };
    const updated = [...inventory, itemToAdd];
    setInventory(updated);
    saveInventory(updated);
    setNewItem({ name: '', quantity: 0, unit: 'pcs', stableQuantity: 0, lowStockThreshold: 10 });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    const updated = inventory.filter(item => item.id !== id);
    setInventory(updated);
    saveInventory(updated);
  };

  const handleStartEdit = (item: any) => {
    setEditingId(item.id);
    setEditItem({ ...item });
  };

  const handleSaveEdit = () => {
    const updated = inventory.map(item => item.id === editingId ? { ...editItem, id: editingId } : item);
    setInventory(updated);
    saveInventory(updated);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-dark tracking-tight">Manage Inventory</h1>
            <p className="text-gray-500 text-sm mt-1">Track and manage your raw materials and stock.</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-opacity-90 transition-all active:scale-95"
          >
            <Plus size={20} /> Add Item
          </button>
        </div>

        {/* Inventory List - Desktop Table */}
        <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                <th className="p-6">Item Name</th>
                <th className="p-6">Quantity</th>
                <th className="p-6">Stable Qty</th>
                <th className="p-6">Low Stock Alert</th>
                <th className="p-6">Unit</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence>
                {isAdding && (
                  <motion.tr 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-primary/5"
                  >
                    <td className="p-4">
                      <input 
                        type="text" 
                        placeholder="e.g. Chicken Leg"
                        value={newItem.name}
                        onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                      />
                    </td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                      />
                    </td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        value={newItem.stableQuantity}
                        onChange={(e) => setNewItem({...newItem, stableQuantity: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                        placeholder="Stable Qty"
                      />
                    </td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        value={newItem.lowStockThreshold}
                        onChange={(e) => setNewItem({...newItem, lowStockThreshold: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                        placeholder="Alert at..."
                      />
                    </td>
                    <td className="p-4">
                      <select 
                        value={newItem.unit}
                        onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm bg-white"
                      >
                        {UNIT_OPTIONS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={handleAdd} className="p-2 bg-primary text-white rounded-lg hover:bg-opacity-90"><Save size={18} /></button>
                        <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300"><X size={18} /></button>
                      </div>
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>

              {inventory.map((item) => (
                <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="p-6">
                    {editingId === item.id ? (
                      <input 
                        type="text" 
                        value={editItem.name}
                        onChange={(e) => setEditItem({...editItem, name: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                          <Package size={20} />
                        </div>
                        <span className="font-bold text-dark">{item.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-6">
                    {editingId === item.id ? (
                      <input 
                        type="number" 
                        value={editItem.quantity}
                        onChange={(e) => setEditItem({...editItem, quantity: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${item.quantity <= (item.lowStockThreshold || 10) ? 'text-red-500' : 'text-dark'}`}>
                          {item.quantity}
                        </span>
                        {item.quantity <= (item.lowStockThreshold || 10) && <AlertCircle size={14} className="text-red-500" />}
                      </div>
                    )}
                  </td>
                  <td className="p-6">
                    {editingId === item.id ? (
                      <input 
                        type="number" 
                        value={editItem.stableQuantity}
                        onChange={(e) => setEditItem({...editItem, stableQuantity: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                      />
                    ) : (
                      <span className="text-gray-500 font-medium">{item.stableQuantity || 0}</span>
                    )}
                  </td>
                  <td className="p-6">
                    {editingId === item.id ? (
                      <input 
                        type="number" 
                        value={editItem.lowStockThreshold}
                        onChange={(e) => setEditItem({...editItem, lowStockThreshold: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                      />
                    ) : (
                      <span className="text-gray-500 font-medium">{item.lowStockThreshold || 10}</span>
                    )}
                  </td>
                  <td className="p-6">
                    {editingId === item.id ? (
                      <select 
                        value={editItem.unit}
                        onChange={(e) => setEditItem({...editItem, unit: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm bg-white"
                      >
                        {UNIT_OPTIONS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-500 text-sm">{item.unit}</span>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      {editingId === item.id ? (
                        <>
                          <button onClick={handleSaveEdit} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Save size={18} /></button>
                          <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleStartEdit(item)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Inventory List - Mobile Cards */}
        <div className="md:hidden space-y-4">
          <AnimatePresence>
            {isAdding && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-3xl border border-primary/20 shadow-lg space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Item Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Chicken Leg"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quantity</label>
                    <input 
                      type="number" 
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stable Qty</label>
                    <input 
                      type="number" 
                      value={newItem.stableQuantity}
                      onChange={(e) => setNewItem({...newItem, stableQuantity: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alert At</label>
                    <input 
                      type="number" 
                      value={newItem.lowStockThreshold}
                      onChange={(e) => setNewItem({...newItem, lowStockThreshold: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unit</label>
                  <select 
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    {UNIT_OPTIONS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleAdd} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold">Add Item</button>
                  <button onClick={() => setIsAdding(false)} className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {inventory.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              {editingId === item.id ? (
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={editItem.name}
                    onChange={(e) => setEditItem({...editItem, name: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <input 
                      type="number" 
                      value={editItem.quantity}
                      onChange={(e) => setEditItem({...editItem, quantity: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                    <input 
                      type="number" 
                      value={editItem.stableQuantity}
                      onChange={(e) => setEditItem({...editItem, stableQuantity: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                    <input 
                      type="number" 
                      value={editItem.lowStockThreshold}
                      onChange={(e) => setEditItem({...editItem, lowStockThreshold: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <select 
                    value={editItem.unit}
                    onChange={(e) => setEditItem({...editItem, unit: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    {UNIT_OPTIONS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} className="flex-1 bg-primary text-white py-2 rounded-xl font-bold">Save</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-100 text-gray-500 py-2 rounded-xl font-bold">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                        <Package size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-dark">{item.name}</h3>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{item.unit}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleStartEdit(item)} className="p-2 text-gray-400 hover:text-primary"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="bg-gray-50 p-3 rounded-2xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xl font-bold ${item.quantity <= (item.lowStockThreshold || 10) ? 'text-red-500' : 'text-dark'}`}>
                          {item.quantity}
                        </span>
                        {item.quantity <= (item.lowStockThreshold || 10) && <AlertCircle size={14} className="text-red-500" />}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Stable</p>
                      <span className="text-xl font-bold text-gray-500">{item.stableQuantity || 0}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Alert At</p>
                      <span className="text-xl font-bold text-gray-500">{item.lowStockThreshold || 10}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageInventory;
