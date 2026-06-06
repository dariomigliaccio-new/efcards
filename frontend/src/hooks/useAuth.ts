'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

export function useAuth() {
  const { user, token, setAuth, logout: storeLogout } = useAuthStore();
  const router = useRouter();

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAuth(data.user, data.token);
    return data.user;
  }, [setAuth]);

  const register = useCallback(async (email: string, username: string, password: string, display_name?: string) => {
    const { data } = await api.post('/auth/register', { email, username, password, display_name });
    setAuth(data.user, data.token);
    return data.user;
  }, [setAuth]);

  const logout = useCallback(() => {
    storeLogout();
    router.push('/');
  }, [storeLogout, router]);

  return { user, token, isAuthenticated: !!user, login, register, logout };
}
