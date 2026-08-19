import { useState, useEffect } from 'react';
import { 
  fetchInventory, 
  createInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem, 
  adjustInventoryStock,
  fetchInventoryLogs 
} from '../api/inventoryService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Package, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  History, 
  Search, 
  Loader2,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const ManageInventory = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'logs'>('inventory');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Creation / Edit states
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, unit: 'pcs', stableQuantity: 0, lowStockThreshold: 10 });
  const [editItem, setEditItem] = useState({ name: '', quantity: 0, unit: 'pcs', stableQuantity: 0, lowStockThreshold: 10 });

  // Quick Stock Adjustment Modal state
  const [adjustingItem, setAdjustingItem] = useState<any | null>(null);
  const [adjustType, setAdjustType] = useState<'stock-in' | 'stock-out' | 'manual-adjustment'>('stock-in');
  const [adjustAmount, setAdjustAmount] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('');

  const UNIT_OPTIONS = ['pcs', 'kg', 'pack', 'bottle', 'can', 'box', 'liter', 'ml', 'g'];

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [itemsData, logsData] = await Promise.all([
        fetchInventory(),
        fetchInventoryLogs(undefined, 100)
      ]);
      setInventory(Array.isArray(itemsData) ? itemsData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (err: any) {
      console.error('Error loading inventory data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async () => {
    if (!newItem.name.trim()) {
      setErrorMessage('Item name is required');
      return;
    }
    if (newItem.quantity < 0) {
      setErrorMessage('Quantity cannot be negative');
      return;
    }

    setErrorMessage('');
    try {
      const created = await createInventoryItem({
        ...newItem,
        stableQuantity: newItem.stableQuantity || 0,
        lowStockThreshold: newItem.lowStockThreshold || 10
      });
      setInventory(prev => {
        // Prevent duplicate items in state
        const exists = prev.some(i => i.id === created.id);
        return exists ? prev.map(i => i.id === created.id ? created : i) : [...prev, created];
      });
      setNewItem({ name: '', quantity: 0, unit: 'pcs', stableQuantity: 0, lowStockThreshold: 10 });
      setIsAdding(false);
      // Refresh logs
      fetchInventoryLogs(undefined, 100).then(setLogs).catch(console.error);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add inventory item');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item? This will be recorded in audit logs.')) {
      try {
        await deleteInventoryItem(id);
        setInventory(prev => prev.filter(item => item.id !== id));
        fetchInventoryLogs(undefined, 100).then(setLogs).catch(console.error);
      } catch (err: any) {
        alert(err.message || 'Failed to delete inventory item');
      }
    }
  };

  const handleStartEdit = (item: any) => {
    setEditingId(item.id);
    setEditItem({ 
      name: item.name, 
      quantity: item.quantity, 
      unit: item.unit || 'pcs', 
      stableQuantity: item.stableQuantity || 0, 
      lowStockThreshold: item.lowStockThreshold || 10 
    });
  };

  const handleSaveEdit = async () => {
    if (!editItem.name.trim()) {
      alert('Item name is required');
      return;
    }
    if (editItem.quantity < 0) {
      alert('Quantity cannot be negative');
      return;
    }

    try {
      const updated = await updateInventoryItem(editingId!, editItem);
      setInventory(prev => prev.map(item => item.id === editingId ? updated : item));
      setEditingId(null);
      fetchInventoryLogs(undefined, 100).then(setLogs).catch(console.error);
    } catch (err: any) {
      alert(err.message || 'Failed to save changes');
    }
  };

  const handleOpenAdjust = (item: any, type: 'stock-in' | 'stock-out' | 'manual-adjustment') => {
    setAdjustingItem(item);
    setAdjustType(type);
    setAdjustAmount(type === 'manual-adjustment' ? item.quantity : 1);
    setAdjustReason('');
  };

  const handleApplyAdjust = async () => {
    if (!adjustingItem) return;
    if (adjustType === 'manual-adjustment' && adjustAmount < 0) {
      alert('Manual quantity cannot be negative');
      return;
    }
    if ((adjustType === 'stock-in' || adjustType === 'stock-out') && adjustAmount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    try {
      const result = await adjustInventoryStock(adjustingItem.id, {
        type: adjustType,
        amount: adjustType !== 'manual-adjustment' ? adjustAmount : undefined,
        newQuantity: adjustType === 'manual-adjustment' ? adjustAmount : undefined,
        reason: adjustReason.trim() || undefined
      });

      if (result.item) {
        setInventory(prev => prev.map(item => item.id === adjustingItem.id ? result.item : item));
      }
      setAdjustingItem(null);
      fetchInventoryLogs(undefined, 100).then(setLogs).catch(console.error);
    } catch (err: any) {
      alert(err.message || 'Stock adjustment failed');
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.unit?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = inventory.filter(item => item.quantity <= (item.lowStockThreshold || 10)).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header and Action Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-2xl border border-gray-200 flex gap-1">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'inventory' 
                    ? 'bg-dark text-white shadow-sm' 
                    : 'text-gray-500 hover:text-dark'
                }`}
              >
                <Package size={16} /> Inventory Items ({inventory.length})
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'logs' 
                    ? 'bg-dark text-white shadow-sm' 
                    : 'text-gray-500 hover:text-dark'
                }`}
              >
                <History size={16} /> Audit History ({logs.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {activeTab === 'inventory' && (
              <button 
                onClick={() => { setIsAdding(true); setErrorMessage(''); }}
                className="w-full sm:w-auto bg-primary text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-opacity-90 transition-all active:scale-95 text-sm"
              >
                <Plus size={18} /> Add Item
              </button>
            )}
          </div>
        </div>

        {/* Low Stock Notification Banner */}
        {lowStockCount > 0 && activeTab === 'inventory' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertCircle size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Low Stock Warning</h4>
                <p className="text-xs text-amber-700 font-medium">
                  {lowStockCount} {lowStockCount === 1 ? 'item is' : 'items are'} below or at minimum threshold and require restocking.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab Content */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search raw materials, units, or stock items..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-primary shadow-sm"
              />
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-6">Item Name</th>
                    <th className="p-6">Current Stock</th>
                    <th className="p-6">Stable Qty</th>
                    <th className="p-6">Low Stock Alert</th>
                    <th className="p-6">Unit</th>
                    <th className="p-6 text-center">Stock Actions</th>
                    <th className="p-6 text-right">Edit/Delete</th>
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
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm font-semibold"
                          />
                        </td>
                        <td className="p-4">
                          <input 
                            type="number" 
                            min="0"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm font-semibold"
                          />
                        </td>
                        <td className="p-4">
                          <input 
                            type="number" 
                            min="0"
                            value={newItem.stableQuantity}
                            onChange={(e) => setNewItem({...newItem, stableQuantity: parseInt(e.target.value) || 0})}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                            placeholder="Stable Qty"
                          />
                        </td>
                        <td className="p-4">
                          <input 
                            type="number" 
                            min="0"
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
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm bg-white font-semibold"
                          >
                            {UNIT_OPTIONS.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4 text-center text-xs text-gray-400 font-medium">Initial Entry</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={handleAdd} className="p-2 bg-primary text-white rounded-lg hover:bg-opacity-90"><Save size={18} /></button>
                            <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300"><X size={18} /></button>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>

                  {filteredInventory.map((item, idx) => {
                    const isLow = item.quantity <= (item.lowStockThreshold || 10);
                    const itemKey = item.id ? `inv-row-${item.id}` : `inv-row-idx-${idx}`;
                    return (
                      <tr key={itemKey} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="p-6">
                          {editingId === item.id ? (
                            <input 
                              type="text" 
                              value={editItem.name}
                              onChange={(e) => setEditItem({...editItem, name: e.target.value})}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm font-semibold"
                            />
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                <Package size={20} />
                              </div>
                              <div>
                                <span className="font-bold text-dark">{item.name}</span>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.id}</p>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-6">
                          {editingId === item.id ? (
                            <input 
                              type="number" 
                              min="0"
                              value={editItem.quantity}
                              onChange={(e) => setEditItem({...editItem, quantity: parseInt(e.target.value) || 0})}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm font-bold"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`text-base font-extrabold ${isLow ? 'text-red-500' : 'text-dark'}`}>
                                {item.quantity}
                              </span>
                              <span className="text-xs text-gray-400 font-bold">{item.unit}</span>
                              {isLow && (
                                <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[9px] font-extrabold uppercase tracking-wider border border-red-100">
                                  Low
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-6">
                          {editingId === item.id ? (
                            <input 
                              type="number" 
                              min="0"
                              value={editItem.stableQuantity}
                              onChange={(e) => setEditItem({...editItem, stableQuantity: parseInt(e.target.value) || 0})}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                            />
                          ) : (
                            <span className="text-gray-500 font-semibold">{item.stableQuantity || 0}</span>
                          )}
                        </td>
                        <td className="p-6">
                          {editingId === item.id ? (
                            <input 
                              type="number" 
                              min="0"
                              value={editItem.lowStockThreshold}
                              onChange={(e) => setEditItem({...editItem, lowStockThreshold: parseInt(e.target.value) || 0})}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                            />
                          ) : (
                            <span className="text-gray-500 font-semibold">{item.lowStockThreshold || 10}</span>
                          )}
                        </td>
                        <td className="p-6">
                          {editingId === item.id ? (
                            <select 
                              value={editItem.unit}
                              onChange={(e) => setEditItem({...editItem, unit: e.target.value})}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm bg-white font-semibold"
                            >
                              {UNIT_OPTIONS.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{item.unit}</span>
                          )}
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenAdjust(item, 'stock-in')}
                              className="px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-green-200/50"
                              title="Stock In"
                            >
                              <TrendingUp size={13} /> +In
                            </button>
                            <button
                              onClick={() => handleOpenAdjust(item, 'stock-out')}
                              className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-red-200/50"
                              title="Stock Out"
                            >
                              <TrendingDown size={13} /> -Out
                            </button>
                            <button
                              onClick={() => handleOpenAdjust(item, 'manual-adjustment')}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-xs font-bold transition-all"
                              title="Set Count"
                            >
                              <SlidersHorizontal size={14} />
                            </button>
                          </div>
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
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
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quantity</label>
                        <input 
                          type="number" 
                          min="0"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stable Qty</label>
                        <input 
                          type="number" 
                          min="0"
                          value={newItem.stableQuantity}
                          onChange={(e) => setNewItem({...newItem, stableQuantity: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alert At</label>
                        <input 
                          type="number" 
                          min="0"
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
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm bg-white font-semibold"
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

              {filteredInventory.map((item, idx) => {
                const isLow = item.quantity <= (item.lowStockThreshold || 10);
                const cardKey = item.id ? `inv-card-${item.id}` : `inv-card-idx-${idx}`;
                return (
                  <div key={cardKey} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    {editingId === item.id ? (
                      <div className="space-y-4">
                        <input 
                          type="text" 
                          value={editItem.name}
                          onChange={(e) => setEditItem({...editItem, name: e.target.value})}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold"
                        />
                        <div className="grid grid-cols-3 gap-4">
                          <input 
                            type="number" 
                            value={editItem.quantity}
                            onChange={(e) => setEditItem({...editItem, quantity: parseInt(e.target.value) || 0})}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold"
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
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm bg-white font-semibold"
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
                              <span className={`text-xl font-extrabold ${isLow ? 'text-red-500' : 'text-dark'}`}>
                                {item.quantity}
                              </span>
                              {isLow && <AlertCircle size={14} className="text-red-500" />}
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

                        {/* Quick Stock Buttons Mobile */}
                        <div className="flex gap-2 pt-1 border-t border-gray-100">
                          <button
                            onClick={() => handleOpenAdjust(item, 'stock-in')}
                            className="flex-1 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-green-200/50"
                          >
                            <TrendingUp size={14} /> +Stock In
                          </button>
                          <button
                            onClick={() => handleOpenAdjust(item, 'stock-out')}
                            className="flex-1 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-red-200/50"
                          >
                            <TrendingDown size={14} /> -Stock Out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Audit Logs Tab Content */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-dark text-lg">Inventory Activity & Audit Trail</h3>
                <p className="text-xs text-gray-400">Chronological history of all stock additions, deductions, adjustments, and orders.</p>
              </div>
              <button 
                onClick={() => fetchInventoryLogs(undefined, 100).then(setLogs)}
                className="text-xs font-bold text-primary hover:underline"
              >
                Refresh Log
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-medium text-sm">
                No inventory logs recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {logs.map((log, logIdx) => {
                  const isPositive = log.quantityChange > 0;
                  const isZero = log.quantityChange === 0;
                  const logKey = log.id ? `log-${log.id}-${logIdx}` : `log-idx-${logIdx}`;
                  return (
                    <div key={logKey} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-gray-50/50 rounded-xl px-2 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          log.type === 'stock-in' ? 'bg-green-50 text-green-600' :
                          log.type === 'stock-out' ? 'bg-red-50 text-red-600' :
                          log.type === 'order-deduction' ? 'bg-blue-50 text-blue-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {log.type === 'stock-in' ? <ArrowUpRight size={18} /> :
                           log.type === 'stock-out' ? <ArrowDownRight size={18} /> :
                           <SlidersHorizontal size={16} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-dark text-sm">{log.itemName}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase tracking-wider">
                              {log.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">{log.reason || 'Inventory movement'}</p>
                          <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold mt-1">
                            <span>By: {log.performedBy || 'Staff'}</span>
                            <span>•</span>
                            <span>{new Date(log.date || log.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right sm:text-right w-full sm:w-auto pl-12 sm:pl-0">
                        <div className={`font-extrabold text-sm ${isPositive ? 'text-green-600' : isZero ? 'text-gray-500' : 'text-red-500'}`}>
                          {isPositive ? `+${log.quantityChange}` : log.quantityChange}
                        </div>
                        <div className="text-[11px] text-gray-400 font-semibold">
                          Remaining: <span className="text-dark font-bold">{log.remainingQuantity}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quick Stock Adjustment Modal */}
        <AnimatePresence>
          {adjustingItem && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <div>
                    <h3 className="font-bold text-dark text-lg">
                      {adjustType === 'stock-in' ? 'Stock In (Replenish)' :
                       adjustType === 'stock-out' ? 'Stock Out (Deduct)' :
                       'Manual Stock Count'}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">{adjustingItem.name} (Current: {adjustingItem.quantity} {adjustingItem.unit})</p>
                  </div>
                  <button onClick={() => setAdjustingItem(null)} className="text-gray-400 hover:text-primary">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {adjustType === 'manual-adjustment' ? `New Total Quantity (${adjustingItem.unit})` : `Amount to ${adjustType === 'stock-in' ? 'Add' : 'Deduct'} (${adjustingItem.unit})`}
                    </label>
                    <input 
                      type="number" 
                      min={adjustType === 'manual-adjustment' ? '0' : '1'}
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-base font-bold text-dark"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reason / Memo (Optional)</label>
                    <input 
                      type="text" 
                      placeholder={adjustType === 'stock-in' ? 'e.g. Supplier delivery invoice #104' : 'e.g. Spoiled or kitchen prep'}
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                  <button 
                    onClick={() => setAdjustingItem(null)}
                    className="flex-1 bg-white border border-gray-200 text-dark py-3 rounded-xl font-bold hover:bg-gray-100 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleApplyAdjust}
                    className={`flex-1 text-white py-3 rounded-xl font-bold shadow-lg transition-all text-sm ${
                      adjustType === 'stock-out' 
                        ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                        : 'bg-primary hover:bg-opacity-90 shadow-primary/20'
                    }`}
                  >
                    Confirm Change
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageInventory;
