import React, { createContext, useState, useContext, useEffect } from 'react';
import { bookApi } from '../lib/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const demoMode = localStorage.getItem('demo_mode');
      const storedUser = localStorage.getItem('user');
      
      if (demoMode === 'true' && storedUser) {
        setIsDemoMode(true);
        setUser(JSON.parse(storedUser));
        setLoading(false);
        return;
      }
      
      if (token) {
        // Пробуем получить профиль
        try {
          const response = await bookApi.getProfile();
          console.log('✅ Профиль получен:', response.data);
          setUser(response.data);
          setIsDemoMode(false);
          
          // Сохраняем пользователя в localStorage
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (profileError) {
          console.error('❌ Ошибка получения профиля:', profileError);
          // Если не удалось получить профиль, используем сохраненного пользователя
          if (storedUser) {
            console.log('🔄 Используем сохраненного пользователя');
            setUser(JSON.parse(storedUser));
          }
        }
      }
    } catch (error) {
      console.error('Ошибка проверки аутентификации:', error);
      // Если токен недействителен, удаляем его
      localStorage.removeItem('token');
      localStorage.removeItem('demo_mode');
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token = null) => {
    console.log('🔐 Сохраняем пользователя в AuthContext:', userData);
    console.log('🔐 ID пользователя:', userData.id);
    console.log('🔐 Токен:', token);
    
    setUser(userData);
    
    // Сохраняем пользователя в localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    
    if (token) {
      localStorage.setItem('token', token);
      localStorage.removeItem('demo_mode');
      setIsDemoMode(false);
    } else {
      // Демо-режим
      localStorage.setItem('demo_mode', 'true');
      setIsDemoMode(true);
    }
  };

  const logout = async () => {
    try {
      if (!isDemoMode) {
        await bookApi.logout();
      }
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('demo_mode');
      localStorage.removeItem('user');
      setUser(null);
      setIsDemoMode(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await bookApi.register(userData);
      const { access_token, user: newUser } = response.data;
      
      console.log('✅ Пользователь зарегистрирован:', newUser);
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.removeItem('demo_mode');
      setUser(newUser);
      setIsDemoMode(false);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Ошибка регистрации' 
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
    isDemoMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};