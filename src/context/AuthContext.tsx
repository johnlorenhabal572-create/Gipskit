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
      { 
        id: 'admin-1', 
        name: 'Store Admin', 
        role: 'admin', 
        status: 'Active',
        email: 'admin@store.com', 
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        orderCount: 0,
        loginHistory: [{ timestamp: new Date().toISOString(), ip: '127.0.0.1', userAgent: 'System Default', action: 'System Provisioned' }]
      },
    ];

    if (savedAccounts) {
      try {
        const parsed = JSON.parse(savedAccounts);
        const merged = [...parsed];
        defaults.forEach(def => {
          if (!merged.find(acc => acc.email?.toLowerCase() === def.email.toLowerCase() || acc.id === def.id)) {
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

  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch users from server API with fallbacks
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAccounts(data);
          localStorage.setItem('capstone_accounts', JSON.stringify(data));
          setLoadingUsers(false);
          return data;
        }
      }
    } catch (err) {
      console.warn('Could not fetch users from server, using local store:', err);
    }
    setLoadingUsers(false);
    return accounts;
  }, [accounts]);

  // Initial fetch on mount if admin
  useEffect(() => {
    fetchUsers();
  }, []);

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
    const cleanEmail = email.trim().toLowerCase();

    // Client-side quick check against existing registered accounts
    const existingLocal = accounts.find(
      (a: any) => a.email && a.email.toLowerCase() === cleanEmail
    );
    if (existingLocal) {
      throw new Error('An account with this Gmail address already exists. Please Sign In instead.');
    }

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, purpose: 'signup' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Network error sending verification code');
    }
  }, [accounts]);

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
    const cleanEmail = email.trim().toLowerCase();

    // Check if account already exists locally
    const existingLocal = accounts.find(
      (a: any) => a.email && a.email.toLowerCase() === cleanEmail
    );
    if (existingLocal) {
      throw new Error('An account with this Gmail address already exists. Please Sign In.');
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
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
  }, [accounts]);

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

  const addAccount = useCallback(async (newAcc: any) => {
    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAcc)
      });
      if (res.ok) {
        const created = await res.json();
        setAccounts(prev => [created, ...prev.filter(a => a.email !== created.email && a.id !== created.id)]);
        return created;
      }
    } catch (err) {
      console.warn('API error creating account, saving locally:', err);
    }

    const accWithId = { 
      ...newAcc, 
      id: `usr_${Date.now()}`,
      email: newAcc.email.toLowerCase(),
      status: newAcc.status || 'Active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      orderCount: 0,
      loginHistory: [{ timestamp: new Date().toISOString(), ip: '127.0.0.1', userAgent: 'Admin Provisioned', action: 'Created' }]
    };
    setAccounts(prev => [accWithId, ...prev.filter(a => a.email !== accWithId.email)]);
    return accWithId;
  }, []);

  const updateAccount = useCallback(async (id: string, updatedData: any) => {
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setAccounts(prev => prev.map(acc => (acc.id === id || acc._id === id) ? { ...acc, ...data.user } : acc));
          return data.user;
        }
      }
    } catch (err) {
      console.warn('API error updating user, updating locally:', err);
    }
    setAccounts(prev => prev.map(acc => (acc.id === id || acc._id === id) ? { ...acc, ...updatedData } : acc));
  }, []);

  // Update Status: Active, Suspended, or Disabled (Preserves records & order history)
  const updateUserStatus = useCallback(async (id: string, status: 'Active' | 'Suspended' | 'Disabled') => {
    return updateAccount(id, { status });
  }, [updateAccount]);

  // Update Role: customer, staff, or admin
  const updateUserRole = useCallback(async (id: string, role: 'customer' | 'staff' | 'admin') => {
    return updateAccount(id, { role });
  }, [updateAccount]);

  // Disable account instead of permanent deletion to preserve all historical orders & receipts
  const disableAccount = useCallback((id: string) => {
    updateUserStatus(id, 'Disabled');
  }, [updateUserStatus]);

  const value = useMemo(() => ({
    user, 
    login,
    sendSignUpCode,
    verifySignUpCode,
    completeSignUp,
    logout, 
    accounts,
    loadingUsers,
    fetchUsers,
    addAccount, 
    updateAccount, 
    updateUserStatus,
    updateUserRole,
    disableAccount
  }), [
    user, 
    login, 
    sendSignUpCode, 
    verifySignUpCode, 
    completeSignUp, 
    logout, 
    accounts, 
    loadingUsers,
    fetchUsers,
    addAccount, 
    updateAccount, 
    updateUserStatus,
    updateUserRole,
    disableAccount
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
