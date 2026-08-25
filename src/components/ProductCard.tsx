import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShoppingBag } from 'lucide-react';

const ProductCard = ({ product }: { product: any }) => {
  const { addToCart } = useContext(CartContext) as any;
  const { user } = useContext(AuthContext) as any;
  const navigate = useNavigate();
  const isAvailable = product.status !== 'Not Available' && (product.stock === undefined || product.stock > 0);

  const handleAction = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/menu' } } });
      return;
    }
    if (isAvailable) {
      addToCart(product);
    }
  };

  return (
    <div className={`border rounded-3xl shadow-sm p-5 bg-white flex flex-col justify-between transition-all ${!isAvailable ? 'opacity-75 grayscale-[0.5]' : 'hover:shadow-md'}`}>
      <div>
        <div className="aspect-square rounded-2xl mb-4 overflow-hidden bg-gray-100 relative">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-white text-red-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                Not Available
              </span>
            </div>
          )}
        </div>
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-dark">{product.name}</h3>
          <span className="text-primary font-bold">₱{product.price}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.category}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${product.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
            Stock: {product.stock}
          </span>
        </div>
      </div>
      
      {!user ? (
        <button 
          id={`product-signin-btn-${product.id}`}
          onClick={handleAction}
          className="w-full py-3 rounded-xl transition-all font-bold text-sm bg-primary/10 text-primary hover:bg-primary hover:text-white shadow-sm flex items-center justify-center gap-2 border border-primary/20 active:scale-95"
        >
          <LogIn size={16} />
          <span>Sign In</span>
        </button>
      ) : (
        <button 
          id={`product-addcart-btn-${product.id}`}
          onClick={handleAction}
          disabled={!isAvailable}
          className={`w-full py-3 rounded-xl transition-all font-bold text-sm flex items-center justify-center gap-2 ${
            isAvailable 
              ? 'bg-dark text-white hover:bg-primary shadow-lg shadow-dark/10 active:scale-95' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ShoppingBag size={16} />
          <span>{isAvailable ? 'Add to Cart' : 'Out of Stock'}</span>
        </button>
      )}
    </div>
  );
};

export default ProductCard;
