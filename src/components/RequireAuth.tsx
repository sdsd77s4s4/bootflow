import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RequireAuthProps {
  children: React.ReactElement;
  allowedRoles?: Array<'admin' | 'reseller' | 'client'>;
}

export default function RequireAuth({ children, allowedRoles = ['admin'] }: RequireAuthProps) {
  const { isAuthenticated, loading, userRole } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole as any)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
