import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('hms_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then(({ data }) => {
          setUser(data.data.user);
          setProfile(data.data.profile);
        })
        .catch(() => {
          localStorage.removeItem('hms_token');
          delete api.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { token, user: u, profile: p } = data.data;
    localStorage.setItem('hms_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(u);
    setProfile(p);
    toast.success(`Welcome back, ${u.full_name}!`);

    // Role-based redirect
    const redirectMap = { admin: '/admin', doctor: '/doctor', patient: '/patient' };
    navigate(redirectMap[u.role] || '/');
    return u;
  }, [navigate]);

  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    const { token, user: u, profile: p } = data.data;
    localStorage.setItem('hms_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(u);
    setProfile(p || null);
    toast.success('Registration successful!');
    const redirectMap = { admin: '/admin', doctor: '/doctor', patient: '/patient' };
    navigate(redirectMap[u.role] || '/');
    return u;
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('hms_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setProfile(null);
    toast.success('Logged out successfully.');
    navigate('/login');
  }, [navigate]);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
