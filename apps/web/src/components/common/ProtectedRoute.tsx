import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '@antigravite/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireCompletedProfile?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireCompletedProfile = true,
}) => {
  const { isAuthenticated, user, hasProfile, isLoading, fetchMe } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchMe();
    }
  }, [isAuthenticated, user, fetchMe]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#60d1d4] animate-spin" />
          <p className="text-xs font-semibold text-[#062224] tracking-wide uppercase">
            Loading AntiGravite...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check profile completion requirement
  if (requireCompletedProfile && !hasProfile && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Check role restrictions if specified
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
