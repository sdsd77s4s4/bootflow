import React from 'react';
import { Navigate } from 'react-router-dom';
import Landing from '@/pages/Landing';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeRoute() {
  const { isAuthenticated, loading, userRole } = useAuth();

  if (loading) return null;

  if (isAuthenticated && userRole === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Landing />;
}
