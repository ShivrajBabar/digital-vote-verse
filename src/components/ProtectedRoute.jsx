
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const ProtectedRoute = ({
  children,
  requiredRole,
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    // If authenticated but wrong role, redirect based on actual role
    if (!loading && isAuthenticated && user) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      
      if (!roles.includes(user.role)) {
        switch (user.role) {
          case 'superadmin':
            navigate('/superadmin/dashboard', { replace: true });
            break;
          case 'admin':
            navigate('/admin/dashboard', { replace: true });
            break;
          case 'voter':
            navigate('/voter/dashboard', { replace: true });
            break;
          default:
            navigate('/login', { replace: true });
        }
      }
    }
  }, [loading, isAuthenticated, user, requiredRole, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return <LoadingSpinner message="Verifying your credentials..." />;
  }

  // If authenticated and correct role, render children
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;
