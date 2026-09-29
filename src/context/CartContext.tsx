import { createContext, useState, useEffect, useMemo, useCallback } from 'react';

export const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('capstone_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [notification, setNotification] = useState<{ message: string; type?: string } | string | null>(null);

  const showNotification = useCallback((message: string, type: 'default' | 'success' = 'default') => {
    setNotification({ message, type });
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

  const updateQuantity = useCallback((productId: string | number, delta: number) => {
    setCart((prevCart: any[]) => {
      const item = prevCart.find((i) => i.id === productId);
      if (!item) return prevCart;

      if (delta < 0) {
        if (item.quantity <= 1) {
          return prevCart;
        }
        const newQty = Math.max(1, item.quantity + delta);
        return prevCart.map((i) =>
          i.id === productId ? { ...i, quantity: newQty } : i
        );
      }

      if (delta > 0) {
        const newQty = item.quantity + delta;
        if (newQty > item.stock) {
          showNotification(`Maximum available quantity reached (${item.stock}).`);
          return prevCart;
        }
        return prevCart.map((i) =>
          i.id === productId ? { ...i, quantity: newQty } : i
        );
      }

      return prevCart;
    });
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
    updateQuantity,
    removeFromCart, 
    getCartTotal, 
    clearCart, 
    notification, 
    showNotification 
  }), [cart, addToCart, updateQuantity, removeFromCart, getCartTotal, clearCart, notification, showNotification]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};