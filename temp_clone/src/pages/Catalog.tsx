import { useState, useEffect, useContext } from 'react';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../api/productService';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { user } = useContext(AuthContext) as any;
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/admin');
      }
      return;
    }
    // Fetch products from our local mock database on component mount
    const data = getProducts();
    setProducts(data);
  }, [user, navigate]);

  if (user) return null;

  // Extract unique categories
  const categories = ['All', ...new Set(products.map(p => p.category))];

  // Filter products based on selected category
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesCategory;
  });

  return (
    <div className="container mx-auto p-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-dark mb-4 uppercase tracking-tight">Our <span className="text-primary">Menu</span></h1>
        <div className="w-20 h-1 bg-primary mx-auto mb-8"></div>
        
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