import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('capstone_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [accounts, setAccounts] = useState<any[]>(() => {
    const savedAccounts = localStorage.getItem('capstone_accounts');
    if (savedAccounts) return JSON.parse(savedAccounts);
    
    // Default accounts
    const defaults = [
      { id: '1', name: 'Store Admin', role: 'admin', email: 'admin@store.com', password: 'admin123' },
      { id: '2', name: 'Store Staff', role: 'staff', email: 'staff@store.com', password: 'staff123' }
    ];
    localStorage.setItem('capstone_accounts', JSON.stringify(defaults));
    return defaults;
  });

  // Save user and accounts to local storage
  useEffect(() => {
    if (user) {
      localStorage.setItem('capstone_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('capstone_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('capstone_accounts', JSON.stringify(accounts));
  }, [accounts]);

  const login = (email, password) => {
    const foundUser = accounts.find(acc => acc.email === email && acc.password === password);
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      return userWithoutPassword;
    }
    return null;
  };

  const logout = () => {
    setUser(null);
  };

  // CRUD Operations for Accounts
  const addAccount = (newAcc: any) => {
    const accWithId = { ...newAcc, id: Date.now().toString() };
    setAccounts([...accounts, accWithId]);
    return accWithId;
  };

  const updateAccount = (id: string, updatedData: any) => {
    setAccounts(accounts.map(acc => acc.id === id ? { ...acc, ...updatedData } : acc));
  };

  const deleteAccount = (id: string) => {
    // Prevent deleting the last admin if possible, or at least warn
    setAccounts(accounts.filter(acc => acc.id !== id));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, accounts, addAccount, updateAccount, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};
