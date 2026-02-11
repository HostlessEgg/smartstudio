import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const csrfRes = await api.get('/auth/csrf');
        if (csrfRes.data?.csrfToken) {
          sessionStorage.setItem('csrfToken', csrfRes.data.csrfToken);
        }
        const meRes = await api.get('/auth/me');
        if (meRes.data?.user) {
          setUser(meRes.data.user);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, csrfToken } = response.data;

      if (csrfToken) sessionStorage.setItem('csrfToken', csrfToken);
      setUser(user);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error de conexión' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user, csrfToken } = response.data;

      if (csrfToken) sessionStorage.setItem('csrfToken', csrfToken);
      setUser(user);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error de conexión' 
      };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('csrfToken');
    api.post('/auth/logout').catch(() => {});
    setUser(null);
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
  };

  const refreshUser = async () => {
    const meRes = await api.get('/auth/me');
    if (meRes.data?.user) setUser(meRes.data.user);
    return meRes.data?.user;
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    updateUser,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};