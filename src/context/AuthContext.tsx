import { createContext, useState, useEffect, useMemo, useCallback } from 'react';

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('capstone_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [accounts, setAccounts] = useState<any[]>(() => {
    const savedAccounts = localStorage.getItem('capstone_accounts');
    const defaults = [
      { id: 'admin-1', name: 'Store Admin', role: 'admin', email: 'admin@store.com', password: 'Admin123' },
    ];

    if (savedAccounts) {
      try {
        const parsed = JSON.parse(savedAccounts);
        const merged = [...parsed];
        defaults.forEach(def => {
          if (!merged.find(acc => acc.email.toLowerCase() === def.email.toLowerCase() || acc.id === def.id)) {
            merged.push(def);
          }
        });
        return merged;
      } catch {
        return defaults;
      }
    }
    
    return defaults;
  });

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

  // Request 6-digit verification code to Gmail
  const sendSignUpCode = useCallback(async (email: string) => {
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), purpose: 'signup' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Network error sending verification code');
    }
  }, []);

  // Verify 6-digit code for Gmail
  const verifySignUpCode = useCallback(async (email: string, code: string) => {
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim()
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired verification code');
      }
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Verification error');
    }
  }, []);

  // Complete sign up by setting password (8 chars, 1 big letter, 1 number)
  const completeSignUp = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
          name: name?.trim()
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sign up failed');
      }

      if (data.success && data.user) {
        setUser(data.user);
        // Sync with local account state
        setAccounts(prev => {
          if (!prev.find(a => a.email.toLowerCase() === data.user.email.toLowerCase())) {
            return [...prev, { ...data.user, password }];
          }
          return prev;
        });
        return data.user;
      }
      throw new Error('Could not complete registration');
    } catch (err: any) {
      throw new Error(err.message || 'Registration error');
    }
  }, []);

  // Unified Sign In (Customers & Admins)
  const login = useCallback(async (email: string, password: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Offline / Client fallback if server API is unreachable or in local preview
        const localFound = accounts.find(
          acc => acc.email.toLowerCase() === cleanEmail && acc.password === cleanPassword
        );
        if (localFound) {
          const { password: _, ...cleanUser } = localFound;
          setUser(cleanUser);
          return cleanUser;
        }
        throw new Error(data.error || 'Invalid credentials');
      }

      if (data.success && data.user) {
        setUser(data.user);
        return data.user;
      }
      throw new Error('Sign in failed');
    } catch (err: any) {
      // Local fallback check
      const localFound = accounts.find(
        acc => acc.email.toLowerCase() === email.trim().toLowerCase() && acc.password === password.trim()
      );
      if (localFound) {
        const { password: _, ...cleanUser } = localFound;
        setUser(cleanUser);
        return cleanUser;
      }
      throw new Error(err.message || 'Invalid Gmail address or password');
    }
  }, [accounts]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const addAccount = useCallback((newAcc: any) => {
    const accWithId = { 
      ...newAcc, 
      id: Date.now().toString(),
      email: newAcc.email.toLowerCase()
    };
    setAccounts(prev => [...prev, accWithId]);
    return accWithId;
  }, []);

  const updateAccount = useCallback((id: string, updatedData: any) => {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updatedData } : acc));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  }, []);

  const value = useMemo(() => ({
    user, 
    login,
    sendSignUpCode,
    verifySignUpCode,
    completeSignUp,
    logout, 
    accounts, 
    addAccount, 
    updateAccount, 
    deleteAccount
  }), [user, login, sendSignUpCode, verifySignUpCode, completeSignUp, logout, accounts, addAccount, updateAccount, deleteAccount]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
