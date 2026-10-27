import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { UserRole } from '@antigravite/types';
import { Navbar } from './components/common/Navbar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { CandidateDashboardPage } from './pages/CandidateDashboardPage';
import { CompanyDashboardPage } from './pages/CompanyDashboardPage';
import { PlatformAdminLoginPage } from './pages/PlatformAdminLoginPage';
import { PlatformAdminDashboardPage } from './pages/PlatformAdminDashboardPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Smart dispatcher component for generic /dashboard path
const RoleDashboardRedirect: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === UserRole.PLATFORM_ADMIN || user.role === UserRole.ADMIN_MANAGER) {
    return <Navigate to="/platform-admin/dashboard" replace />;
  }

  if (user.role === UserRole.CANDIDATE) {
    return <Navigate to="/candidate/dashboard" replace />;
  }

  return <Navigate to="/company/dashboard" replace />;
};

export const App: React.FC = () => {
  const { isAuthenticated, fetchMe } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
    }
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-[#062224] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />

            {/* Dedicated Platform Administration Authentication */}
            <Route path="/platform-admin/login" element={<PlatformAdminLoginPage />} />

            {/* Candidate & Company Onboarding */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute requireCompletedProfile={false}>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            {/* Role Dispatcher */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireCompletedProfile={true}>
                  <RoleDashboardRedirect />
                </ProtectedRoute>
              }
            />

            {/* Candidate Portal */}
            <Route
              path="/candidate/dashboard"
              element={
                <ProtectedRoute
                  allowedRoles={[UserRole.CANDIDATE, UserRole.PLATFORM_ADMIN]}
                  requireCompletedProfile={true}
                >
                  <CandidateDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Company Portal (Recruiter, Hiring Manager, Ads Manager, Company Owner) */}
            <Route
              path="/company/dashboard"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    UserRole.COMPANY_OWNER,
                    UserRole.RECRUITER,
                    UserRole.HIRING_MANAGER,
                    UserRole.ADS_MANAGER,
                    UserRole.PLATFORM_ADMIN,
                  ]}
                  requireCompletedProfile={true}
                >
                  <CompanyDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Platform Administration Console */}
            <Route
              path="/platform-admin/dashboard"
              element={
                <ProtectedRoute
                  allowedRoles={[UserRole.PLATFORM_ADMIN, UserRole.ADMIN_MANAGER]}
                  requireCompletedProfile={false}
                >
                  <PlatformAdminDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/register" replace />
                )
              }
            />

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
