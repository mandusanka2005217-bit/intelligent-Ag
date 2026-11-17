import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/core/store/authStore';
import AppLayout from './AppLayout';

export const ProtectedLayout: React.FC = () => {
  const { currentUser } = useAuthStore();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
};

export default ProtectedLayout;
