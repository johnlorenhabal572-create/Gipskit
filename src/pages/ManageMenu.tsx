import { useState, useEffect, useMemo } from 'react';
import { fetchProducts, createProduct, editProduct, removeProduct, fetchCategories, createCategory, CATEGORIES } from '../api/productService';
import { fetchInventory, getInventory } from '../api/inventoryService';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, X, Link as LinkIcon, Image as ImageIcon, Upload, Loader2, Tag, FolderPlus, Search, Utensils } from 'lucide-react';
import { IMAGES } from '../constants/images';

const ManageMenu = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Search & Category Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // New Category Creation state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryMsg, setCategoryMsg] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: 'Soups',
    image: '',
    inventoryLinkId: '',
    stock: 0,
    status: 'Available',
    description: ''
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodsData, invData, catsData] = await Promise.all([
        fetchProducts(),
        fetchInventory(),
        fetchCategories()
      ]);
      const uniqueProds = Array.from(new Map((prodsData || []).map((item: any) => [item.id, item])).values());
      const uniqueInv = Array.from(new Map((invData || []).map((item: any) => [item.id, item])).values());
      setProducts(uniqueProds);
      setInventory(uniqueInv);
      if (Array.isArray(catsData) && catsData.length > 0) {
        setCategories(catsData);
      }
    } catch (err: any) {
      console.error('Error loading menu & inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setCategoryMsg('Category name cannot be empty');
      return;
    }
    try {
      await createCategory(newCategoryName.trim());
      const updatedCats = await fetchCategories();
      setCategories(updatedCats);
      setFormData(prev => ({ ...prev, category: newCategoryName.trim() }));
      setNewCategoryName('');
      setIsAddingCategory(false);
      setCategoryMsg('');
    } catch (err: any) {
      setCategoryMsg(err.message || 'Failed to create category');
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      setErrorMessage('Dish name is required');
      return;
    }
    if (formData.price < 0) {
      setErrorMessage('Price cannot be negative');
      return;
    }

    setErrorMessage('');
    try {
      const newProd = await createProduct({
        ...formData,
        stock: formData.stock || 0,
        inventoryLinkId: formData.inventoryLinkId || null
      });
      setProducts(prev => [...prev, newProd]);
      resetForm();
      setIsAdding(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add product');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await removeProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (err: any) {
        alert(err.message || 'Failed to delete product');
      }
    }
  };

  const handleStartEdit = (product: any) => {
    setEditingId(product.id);
    setErrorMessage('');
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category || 'Soups',
      image: product.image,
      inventoryLinkId: product.inventoryLinkId || '',
      stock: product.stock || 0,
      status: product.status || 'Available',
      description: product.description || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!formData.name.trim()) {
      setErrorMessage('Dish name is required');
      return;
    }
    if (formData.price < 0) {
      setErrorMessage('Price cannot be negative');
      return;
    }

    setErrorMessage('');
    const updated = { ...formData, id: editingId };
    try {
      const saved = await editProduct(editingId!, updated);
      setProducts(prev => prev.map(p => p.id === editingId ? saved : p));
      setEditingId(null);
      resetForm();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save product');
    }
  };

  const resetForm = () => {
    setErrorMessage('');
    setFormData({
      name: '',
      price: 0,
      category: categories[0] || 'Soups',
      image: IMAGES.PRODUCT_PLACEHOLDER,
      inventoryLinkId: '',
      stock: 0,
      status: 'Available',
      description: ''
    });
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const q = searchTerm.toLowerCase().trim();
      const nameMatch = p.name?.toLowerCase().includes(q);
      const descMatch = p.description?.toLowerCase().includes(q);
      const catMatch = p.category?.toLowerCase().includes(q);
      const matchesSearch = q === '' || nameMatch || descMatch || catMatch;

      const matchesCat = selectedCategory === 'All' || (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setFormData({ ...formData, image: compressed });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-dark tracking-tight">Manage Menu</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Add, edit, or remove items from your customer and POS catalog.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => { setIsAddingCategory(true); setCategoryMsg(''); }}
              className="bg-white text-dark border border-gray-300 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
            >
              <FolderPlus size={15} /> Add Category
            </button>
            <button 
              onClick={() => { setIsAdding(true); resetForm(); }}
              className="bg-dark text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary transition-colors active:translate-y-0.5"
            >
              <Plus size={16} /> Add Menu Item
            </button>
          </div>
        </div>

        {/* Add Category Modal */}
        <AnimatePresence>
          {isAddingCategory && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl border border-gray-200 w-full max-w-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <h3 className="text-sm font-black text-dark uppercase tracking-wide flex items-center gap-2">
                    <FolderPlus size={16} /> Create New Category
                  </h3>
                  <button onClick={() => setIsAddingCategory(false)} className="text-gray-400 hover:text-dark">
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleCreateCategory} className="p-5 space-y-4">
                  {categoryMsg && (
                    <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
                      {categoryMsg}
                    </p>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                      Category Name *
                    </label>
                    <input 
                      type="text" 
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Desserts, Specials"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-dark text-xs font-semibold text-dark"
                      autoFocus
                    />
                    <p className="text-[11px] text-gray-500">This category will immediately be available for menu items and customer filters.</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingCategory(false)}
                      className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-dark text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-primary"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Add/Edit Form Modal-like Overlay */}
        <AnimatePresence>
          {(isAdding || editingId) && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div 
                className="bg-white rounded-xl border border-gray-200 w-full max-w-lg overflow-hidden"
              >
                <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <h2 className="text-base font-black text-dark uppercase tracking-wide">{editingId ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
                  <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-gray-400 hover:text-dark transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  {errorMessage && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
                      {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Dish Name *</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-dark text-xs font-semibold text-dark"
                        placeholder="e.g. Chicken Inasal"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Price (₱) *</label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-dark text-xs font-semibold text-dark"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Category *</label>
                      <button 
                        type="button" 
                        onClick={() => setIsAddingCategory(true)}
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        + New Category
                      </button>
                    </div>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-dark text-xs bg-white font-semibold text-dark"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Product Description Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                      <Tag size={12} /> Product Description
                    </label>
                    <textarea 
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-dark text-xs text-dark placeholder:text-gray-400"
                      placeholder="Write details about the ingredients, recipe, flavor notes, and allergen information for customers..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Product Image</label>
                    <div className="flex gap-3 items-center">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                        <img src={formData.image || IMAGES.PRODUCT_PLACEHOLDER} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="relative">
                          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                          <input 
                            type="text" 
                            value={formData.image}
                            onChange={(e) => setFormData({...formData, image: e.target.value})}
                            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-dark text-xs text-dark"
                            placeholder="Paste image URL..."
                          />
                        </div>
                        <label className="flex items-center justify-center gap-2 w-full py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:border-dark hover:text-dark cursor-pointer transition-colors">
                          <Upload size={13} />
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
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Link to Inventory (Auto-Deduct)</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <select 
                        value={formData.inventoryLinkId}
                        onChange={(e) => setFormData({...formData, inventoryLinkId: e.target.value})}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-dark text-xs bg-white text-dark font-medium"
                      >
                        <option value="">No Link (Manual Stock)</option>
                        {inventory.map((item, idx) => (
                          <option key={item.id ? `opt-${item.id}` : `opt-${idx}`} value={item.id}>{item.name} ({item.unit})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {!formData.inventoryLinkId && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Available Quantity (Manual)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-dark text-xs font-semibold text-dark"
                        placeholder="Current stock level"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Availability Status</label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, status: 'Available'})}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${formData.status === 'Available' ? 'bg-green-50 border-green-600 text-green-700' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}
                      >
                        Available
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, status: 'Not Available'})}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${formData.status === 'Not Available' ? 'bg-red-50 border-red-600 text-red-700' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}
                      >
                        Not Available
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => { setIsAdding(false); setEditingId(null); }}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={editingId ? handleSaveEdit : handleAdd}
                    className="flex-1 bg-dark text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-primary transition-colors active:translate-y-0.5"
                  >
                    {editingId ? 'Save Changes' : 'Add to Menu'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Search & Category Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4 justify-between">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search dishes by name, description, or category..."
              className="w-full pl-10 pr-9 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:border-dark text-xs font-semibold text-dark placeholder:text-gray-400"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category:</span>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-bold text-dark focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories ({products.length})</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {(searchTerm || selectedCategory !== 'All') && (
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                className="text-[11px] font-bold text-gray-500 hover:text-dark underline px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={28} className="animate-spin text-dark" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="bg-white p-12 rounded-xl border border-gray-200 text-center shadow-sm">
            <Utensils className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-sm font-bold text-dark">No menu items found</p>
            <p className="text-xs text-gray-500 mt-1">Try searching with a different term or selecting another category.</p>
            {(searchTerm || selectedCategory !== 'All') && (
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                className="mt-4 bg-dark text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-primary transition-colors"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        )}

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product, idx) => (
            <div key={product.id ? `menu-prod-${product.id}` : `menu-prod-idx-${idx}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden group flex flex-col justify-between shadow-sm">
              <div>
                <div className="aspect-video relative overflow-hidden bg-gray-100 border-b border-gray-200">
                  <img src={product.image || IMAGES.PRODUCT_PLACEHOLDER} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                    <button onClick={() => handleStartEdit(product)} className="p-1.5 bg-white border border-gray-200 rounded text-gray-700 hover:text-dark hover:border-dark transition-colors shadow-sm" title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-1.5 bg-white border border-gray-200 rounded text-gray-700 hover:text-red-600 hover:border-red-300 transition-colors shadow-sm" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 flex gap-1.5">
                    <span className="bg-dark text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      {product.category}
                    </span>
                    <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${product.status === 'Available' ? 'bg-green-700' : 'bg-red-700'}`}>
                      {product.status || 'Available'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-dark text-sm">{product.name}</h3>
                    <span className="text-primary font-black text-sm">₱{product.price}</span>
                  </div>

                  {product.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  {product.inventoryLinkId ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-700 uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded border border-green-200 w-fit">
                        <LinkIcon size={11} />
                        Linked to {inventory.find(i => i.id === product.inventoryLinkId)?.name || 'Inventory'}
                      </div>
                      <div className="text-xs font-medium text-gray-600">
                        Available: <span className={`font-bold ${product.stock <= 5 ? 'text-red-600' : 'text-dark'}`}>{product.stock}</span> units
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Manual Stock Control
                      </div>
                      <div className="text-xs font-medium text-gray-600">
                        Available: <span className={`font-bold ${product.stock <= 5 ? 'text-red-600' : 'text-dark'}`}>{product.stock}</span> units
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageMenu;
