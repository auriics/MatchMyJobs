import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Sparkles, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, candidateProfile, companyProfile, isAuthenticated, logout } =
    useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName =
    candidateProfile?.fullName || companyProfile?.name || user?.email.split('@')[0];

  const avatarUrl =
    candidateProfile?.avatarUrl || companyProfile?.logoUrl;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#e2f7f9] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#60d1d4] to-[#3eb8bb] flex items-center justify-center text-[#062224] shadow-md shadow-[#60d1d4]/30 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 text-[#062224]" />
          </div>
          <div>
            <span className="font-display font-extrabold text-xl tracking-tight text-[#062224]">
              AntiGrav<span className="text-[#3eb8bb]">ite</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#d1f4f3] text-[#062224]">
              AI Matching
            </span>
          </div>
        </Link>

        {/* Right Nav actions */}
        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="text-sm font-medium text-[#062224] hover:text-[#3eb8bb] transition-colors"
              >
                Dashboard
              </Link>

              {/* User Pill */}
              <div className="flex items-center space-x-2.5 bg-[#e2f7f9] py-1.5 px-3 rounded-full border border-[#b1f0ee]">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-7 h-7 rounded-full object-cover border border-[#60d1d4]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#60d1d4] text-[#062224] flex items-center justify-center font-bold text-xs">
                    {displayName ? displayName.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-[#062224] leading-none">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {user.role}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-[#062224] hover:text-[#3eb8bb] px-3 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-[#062224] bg-[#60d1d4] hover:bg-[#3eb8bb] px-4 py-2 rounded-xl shadow-sm shadow-[#60d1d4]/30 hover:shadow-md transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
