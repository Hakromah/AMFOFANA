import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import api from '@/lib/api';
import { saveToken, getToken, saveRole, getRole, saveUser, getUser, clearAll } from '@/lib/auth';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  username: string;
  schoolRole: string;
  userId?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: UserProfile | null;
  role: string | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate auth state from SecureStore on app launch
  useEffect(() => {
    const rehydrate = async () => {
      try {
        const [storedToken, storedRole, storedUser] = await Promise.all([
          getToken(),
          getRole(),
          getUser(),
        ]);
        if (storedToken && storedRole) {
          setToken(storedToken);
          setRole(storedRole);
          setUser(storedUser as UserProfile | null);
        }
      } catch (e) {
        console.error('[Auth] Rehydration failed:', e);
      } finally {
        setIsLoading(false);
      }
    };
    rehydrate();
  }, []);

  const login = async (identifier: string, password: string) => {
    const response = await api.post('/auth/local', { identifier, password });

    const jwt: string = response.data.jwt;
    const userData: UserProfile = response.data.user;
    const userRole: string =
      userData.schoolRole || userData.role?.name || 'STUDENT';

    // Persist to SecureStore
    await Promise.all([
      saveToken(jwt),
      saveRole(userRole),
      saveUser(userData),
    ]);

    setToken(jwt);
    setRole(userRole);
    setUser(userData);

    // Navigate to the correct dashboard
    switch (userRole) {
      case 'ADMIN':
        router.replace('/(admin)' as any);
        break;
      case 'TEACHER':
        router.replace('/(teacher)' as any);
        break;
      case 'STUDENT':
      default:
        router.replace('/(student)' as any);
        break;
    }
  };

  const logout = async () => {
    await clearAll();
    setToken(null);
    setRole(null);
    setUser(null);
    router.replace('/(public)' as any);
  };

  return (
    <AuthContext.Provider value={{ user, role, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
