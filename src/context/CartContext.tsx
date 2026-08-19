import { createContext, useState, useEffect, useMemo, useCallback } from 'react';

export const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('capstone_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    localStorage.setItem('capstone_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((product: any) => {
    setCart((prevCart: any[]) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      
      if (currentQty >= product.stock) {
        showNotification(`Sorry, only ${product.stock} units available.`);
        return prevCart;
      }

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    
    showNotification(`${product.name} added to cart!`);
  }, [showNotification]);

  const removeFromCart = useCallback((productId: string | number) => {
    setCart((prevCart: any[]) => prevCart.filter((item) => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total: number, item: any) => total + item.price * item.quantity, 0);
  }, [cart]);

  const value = useMemo(() => ({ 
    cart, 
    addToCart, 
    removeFromCart, 
    getCartTotal, 
    clearCart, 
    notification, 
    showNotification 
  }), [cart, addToCart, removeFromCart, getCartTotal, clearCart, notification, showNotification]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};