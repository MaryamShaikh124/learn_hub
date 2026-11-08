import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('learnhub_user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('learnhub_token')));

  const acceptSession = useCallback((data) => {
    localStorage.setItem('learnhub_token', data.token);
    localStorage.setItem('learnhub_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('learnhub_token');
    localStorage.removeItem('learnhub_user');
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener('learnhub:unauthorized', handleUnauthorized);
    if (localStorage.getItem('learnhub_token')) {
      api.get('/auth/me')
        .then(({ data }) => {
          setUser(data.data.user);
          localStorage.setItem('learnhub_user', JSON.stringify(data.data.user));
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    }
    return () => window.removeEventListener('learnhub:unauthorized', handleUnauthorized);
  }, [logout]);

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return acceptSession(data.data);
  };
  const register = async (details) => {
    const { data } = await api.post('/auth/register', {
      ...details,
      confirmPassword: details.confirmPassword || details.password,
    });
    return acceptSession(data.data);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout, setUser }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
