'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  name: string;
  email: string;
  role: 'user' | 'admin';
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('nutrisnap_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((role: 'user' | 'admin') => {
    const userData: User = {
      name: role === 'admin' ? 'Admin' : 'Demo User',
      email: role === 'admin' ? 'admin@nutrisnap.app' : 'user@nutrisnap.app',
      role,
    };
    localStorage.setItem('nutrisnap_user', JSON.stringify(userData));
    setUser(userData);
    if (role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('nutrisnap_user');
    setUser(null);
    router.push('/login');
  }, [router]);

  return { user, login, logout, isAdmin: user?.role === 'admin', loading };
};
