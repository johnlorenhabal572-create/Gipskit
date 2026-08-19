import { useState, useEffect } from 'react';
import { getProducts, saveProducts, addProduct, updateProduct, deleteProduct } from '../api/productService';
import { getInventory } from '../api/inventoryService';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Save, X, Utensils, Link as LinkIcon, Image as ImageIcon, Upload } from 'lucide-react';
import { IMAGES } from '../constants/images';

const ManageMenu = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: 'Main Course',
    image: '',
    inventoryLinkId: '',
    status: 'Available'
  });

  useEffect(() => {
    setProducts(getProducts());
    setInventory(getInventory());
  }, []);

  const handleAdd = () => {
    if (!formData.name) return;
    const newProd = addProduct({
      ...formData,
      stock: 100, // Default stock
      inventoryLinkId: formData.inventoryLinkId || null
    });
    setProducts([...products, newProd]);
    resetForm();
    setIsAdding(false);
  };

  const handleDelete = (id: number) => {
    deleteProduct(id);
    setProducts(products.filter(p => p.id !== id));
  };

  const handleStartEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.image,
      inventoryLinkId: product.inventoryLinkId || '',
      status: product.status || 'Available'
    });
  };

  const handleSaveEdit = () => {
    const updated = { ...formData, id: editingId, stock: 100 };
    updateProduct(updated);
    setProducts(products.map(p => p.id === editingId ? updated : p));
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      category: 'Main Course',
      image: IMAGES.PRODUCT_PLACEHOLDER,
      inventoryLinkId: '',
      status: 'Available'
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-dark tracking-tight">Manage Menu</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Add, edit, or remove items from your customer and POS menus.</p>
          </div>
          <button 
            onClick={() => { setIsAdding(true); resetForm(); }}
            className="w-full sm:w-auto bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-opacity-90 transition-all active:scale-95"
          >
            <Plus size={20} /> Add Menu Item
          </button>
        </div>

        {/* Add/Edit Form Modal-like Overlay */}
        <AnimatePresence>
          {(isAdding || editingId) && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h2 className="text-xl font-bold text-dark">{editingId ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
                  <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-gray-400 hover:text-primary transition-colors">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dish Name</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                        placeholder="e.g. Chicken Inasal"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price (₱)</label>
                      <input 
                        type="number" 
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm bg-white"
                    >
                      <option value="Main Course">Main Course</option>
                      <option value="Seafood">Seafood</option>
                      <option value="Supplement">Supplement</option>
                      <option value="Beverage">Beverage</option>
                      <option value="Appetizer">Appetizer</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product Image</label>
                    <div className="flex gap-4 items-center">
                      <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                        <img src={formData.image || IMAGES.PRODUCT_PLACEHOLDER} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="relative">
                          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input 
                            type="text" 
                            value={formData.image}
                            onChange={(e) => setFormData({...formData, image: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs"
                            placeholder="Paste image URL..."
                          />
                        </div>
                        <label className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-500 hover:border-primary hover:text-primary cursor-pointer transition-all">
                          <Upload size={14} />
                          Upload from Device
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Link to Inventory (Auto-Deduct)</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <select 
                        value={formData.inventoryLinkId}
                        onChange={(e) => setFormData({...formData, inventoryLinkId: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm bg-white"
                      >
                        <option value="">No Link (Manual Stock)</option>
                        {inventory.map(item => (
                          <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Availability Status</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setFormData({...formData, status: 'Available'})}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${formData.status === 'Available' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-gray-200 text-gray-400'}`}
                      >
                        Available
                      </button>
                      <button 
                        onClick={() => setFormData({...formData, status: 'Not Available'})}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${formData.status === 'Not Available' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-400'}`}
                      >
                        Not Available
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
                    {editingId ? 'Save Changes' : 'Add to Menu'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group">
              <div className="aspect-video relative overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button onClick={() => handleStartEdit(product)} className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-gray-600 hover:text-primary transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-gray-600 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className="bg-dark/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">
                    {product.category}
                  </span>
                  <span className={`backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${product.status === 'Available' ? 'bg-green-600/80' : 'bg-red-600/80'}`}>
                    {product.status || 'Available'}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-dark">{product.name}</h3>
                  <span className="text-primary font-bold">₱{product.price}</span>
                </div>
                {product.inventoryLinkId ? (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-lg w-fit">
                    <LinkIcon size={12} />
                    Linked to {inventory.find(i => i.id === product.inventoryLinkId)?.name || 'Inventory'}
                  </div>
                ) : (
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Manual Stock Control
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageMenu;
