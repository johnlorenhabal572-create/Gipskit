import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext) as any;
  const isAvailable = product.status !== 'Not Available';

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
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">{product.category}</p>
      </div>
      <button 
        onClick={() => isAvailable && addToCart(product)}
        disabled={!isAvailable}
        className={`w-full py-3 rounded-xl transition-all font-bold text-sm ${
          isAvailable 
            ? 'bg-dark text-white hover:bg-primary shadow-lg shadow-dark/10' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isAvailable ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  );
};

export default ProductCard;
