import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = sessionStorage.getItem('token');
      const userData = sessionStorage.getItem('user');

      if (savedToken && userData) {
        setToken(savedToken);
        setUser(JSON.parse(userData));
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      }

      // Ensure splash screen shows for at least 1.5 seconds for a premium feel
      setTimeout(() => {
        setLoading(false);
      }, 1500);
    };

    checkAuth();
  }, []);

  const login = (newToken, userData) => {
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};