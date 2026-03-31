import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '../types/api.types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuthState(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('forte_token');
    const storedUser = localStorage.getItem('forte_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('forte_token', res.token);
    localStorage.setItem('forte_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await authApi.register(name, email, password);
    localStorage.setItem('forte_token', res.token);
    localStorage.setItem('forte_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('forte_token');
    localStorage.removeItem('forte_user');
    setToken(null);
    setUser(null);
  };

  return { user, token, isLoading, login, register, logout };
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
