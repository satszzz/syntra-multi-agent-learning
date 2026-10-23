import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, studentService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('syntra_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('syntra_token');
      const storedUser = localStorage.getItem('syntra_user');
      
      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Refresh profile in background
          const profRes = await studentService.getProfile();
          setProfile(profRes.data);
        } catch (err) {
          console.error("Auth hydration error:", err);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const refreshProfile = async () => {
    try {
      const res = await studentService.getProfile();
      setProfile(res.data);
      return res.data;
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('syntra_token', access_token);
    localStorage.setItem('syntra_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    await refreshProfile();
    return userData;
  };

  const register = async (name, email, password, preferred_learning_style) => {
    const res = await authService.register({ name, email, password, preferred_learning_style });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('syntra_token', access_token);
    localStorage.setItem('syntra_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    await refreshProfile();
    return userData;
  };

  const demoLogin = async () => {
    const res = await authService.demoLogin();
    const { access_token, user: userData } = res.data;
    localStorage.setItem('syntra_token', access_token);
    localStorage.setItem('syntra_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    await refreshProfile();
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('syntra_token');
    localStorage.removeItem('syntra_user');
    setUser(null);
    setProfile(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      token,
      loading,
      login,
      register,
      demoLogin,
      logout,
      refreshProfile,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
