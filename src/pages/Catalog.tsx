import { useState, useEffect, useContext } from 'react';
import ProductCard from '../components/ProductCard';
import { fetchProducts, CATEGORIES } from '../api/productService';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const Catalog = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useContext(AuthContext) as any;
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'customer') {
      navigate('/dashboard');
      return;
    }

    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        console.error('Failed to load menu catalog:', error);
      }
    };

    loadProducts();
  }, [user, navigate]);

  if (user && user.role !== 'customer') return null;

  // Use fixed category list
  const categories = ['All', ...CATEGORIES];

  // Filter products based on selected category and search term
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto p-6 py-12">
      <div className="text-center mb-12 max-w-2xl mx-auto">
        <div className="relative mb-10 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={24} />
          <input 
            type="text" 
            placeholder="What delicious dish are you looking for?" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-6 rounded-[2rem] bg-white border border-gray-100 shadow-xl shadow-gray-100/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg font-medium text-dark placeholder:text-gray-300"
          />
        </div>
        
        {/* Category Filter Bar */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                selectedCategory === category 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 font-medium">No items found in this category.</p>
        </div>
      )}
    </div>
  );
};

export default Catalog;
