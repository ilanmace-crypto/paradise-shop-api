import React, { createContext, useState, useContext } from 'react';
import { login as apiLogin } from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  // Логин только по паролю: username всегда "admin"
  const login = async (password) => {
    try {
      const trimmed = (password || '').trim();
      // Жёсткая фронтовая проверка пароля, чтобы не пускать случайных людей в админку
      if (trimmed !== 'paradise251208') {
        return false;
      }

      // Если пароль корректен — помечаем пользователя как админа локально
      const fakeUser = { id: 1, username: 'admin', role: 'admin' };
      setIsAuthenticated(true);
      setIsAdmin(true);
      setUser(fakeUser);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    isAdmin,
    user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
