import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize cart from localStorage, or default to an empty array
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('capstone_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Whenever the cart state changes, automatically save it to localStorage
  useEffect(() => {
    localStorage.setItem('capstone_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    
    // Set notification
    showNotification(`${product.name} added to cart!`);
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const clearCart = () => setCart([]);
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Make sure to update your return statement at the bottom to include it!
  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, getCartTotal, clearCart, notification, showNotification }}>
      {children}
    </CartContext.Provider>
  );
};