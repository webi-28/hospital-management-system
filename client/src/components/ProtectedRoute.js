import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    // Redirect to correct dashboard
    const home = { admin: '/admin', doctor: '/doctor', patient: '/patient' };
    return <Navigate to={home[user.role] || '/login'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
