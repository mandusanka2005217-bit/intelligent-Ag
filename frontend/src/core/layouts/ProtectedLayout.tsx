import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/core/store/authStore';
import AppLayout from './AppLayout';

export const ProtectedLayout: React.FC = () => {
  const { currentUser } = useAuthStore();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const role = currentUser.role;
  const path = location.pathname;

  // Enforce strict access control:
  // If Farmer tries to access admin or buyer pages:
  if (role === 'farmer') {
    const isAllowed = path.startsWith('/farmer-dashboard') || path.startsWith('/prices');
    if (!isAllowed) {
      return <Navigate to="/farmer-dashboard" replace />;
    }
  }

  // If Buyer tries to access admin or farmer pages:
  if (role === 'buyer') {
    const isAllowed = path.startsWith('/buyer-dashboard') || path.startsWith('/prices');
    if (!isAllowed) {
      return <Navigate to="/buyer-dashboard" replace />;
    }
  }

  // Admin has access to everything
  return <AppLayout />;
};

export default ProtectedLayout;
