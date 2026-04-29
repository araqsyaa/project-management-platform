import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, getToken, setToken, storeUser, clearToken, toFrontendRole, onAuthStateChanged } from '../api/client';
import { FrontendUser } from '../types/frontend';

interface AuthContextType {
  user: FrontendUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toUser(apiUser: { id: number; name: string; email: string; role: string; avatar?: string }): FrontendUser {
  return {
    id: String(apiUser.id),
    name: apiUser.name,
    email: apiUser.email,
    role: toFrontendRole(apiUser.role) as FrontendUser['role'],
    avatar: apiUser.avatar,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FrontendUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      clearToken();
      setUser(null);
      setLoading(false);
      return;
    }

    api.auth.me()
      .then((me) => {
        storeUser(me);
        setUser(toUser(me));
      })
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setLoading(false);
    };

    window.addEventListener('pm-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('pm-auth-expired', handleAuthExpired);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.auth.login(email, password);
      setToken(res.token);
      storeUser(res.user);
      setUser(toUser(res.user));
      onAuthStateChanged();
      return true;
    } catch {
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.auth.register(name, email, password);
      setToken(res.token);
      storeUser(res.user);
      setUser(toUser(res.user));
      onAuthStateChanged();
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    onAuthStateChanged();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
