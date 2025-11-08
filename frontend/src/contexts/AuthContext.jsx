import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

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
    console.log('🔄 AuthContext useEffect ejecutándose...');
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    console.log('📦 Token en localStorage:', token ? 'SÍ' : 'NO');
    console.log('📦 User en localStorage:', userData ? 'SÍ' : 'NO');

    if (token && userData) {
      console.log('✅ Usuario encontrado, estableciendo estado...');
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      console.log('❌ No hay usuario autenticado');
    }
    setLoading(false);
    console.log('🏁 AuthContext listo, loading:', false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Iniciando login...');
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;

      console.log('✅ Login exitoso, guardando datos...');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      console.log('👤 Usuario establecido:', user);

      return { success: true };
    } catch (error) {
      console.error('❌ Error en login:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error de conexión' 
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Iniciando registro...');
      const response = await axios.post('/api/auth/register', userData);
      const { token, user } = response.data;

      console.log('✅ Registro exitoso, guardando datos...');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);

      return { success: true };
    } catch (error) {
      console.error('❌ Error en registro:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error de conexión' 
      };
    }
  };

  const logout = () => {
    console.log('🚪 Cerrando sesión...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};