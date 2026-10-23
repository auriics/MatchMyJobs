import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../lib/axios';
import { UserRole } from '@antigravite/types';
import { Loader2 } from 'lucide-react';

interface SocialAuthButtonsProps {
  role?: UserRole;
  mode?: 'login' | 'register';
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  role = UserRole.CANDIDATE,
  mode = 'login',
}) => {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'linkedin' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleOAuth = async (provider: 'google' | 'linkedin') => {
    setLoadingProvider(provider);
    setError(null);

    try {
      // In web, generate a realistic OAuth flow token or test mock token
      const mockEmail = `${provider}.user@antigravite.ai`;
      const token = `mock-${provider}-${mockEmail}`;

      const res = await apiClient.post(`/auth/${provider}`, {
        token,
        role: mode === 'register' ? role : undefined,
      });

      const authData = res.data.data;
      setAuth(authData);

      // Navigate based on profile status
      if (!authData.hasProfile) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || `${provider} authentication failed`);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="w-full space-y-3">
      {error && (
        <div className="p-2.5 text-xs text-red-600 bg-red-50 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Google Button */}
      <button
        type="button"
        onClick={() => handleOAuth('google')}
        disabled={loadingProvider !== null}
        className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-xs font-semibold text-[#062224] shadow-sm transition-all duration-150 disabled:opacity-60"
      >
        {loadingProvider === 'google' ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#60d1d4]" />
        ) : (
          <svg className="w-4 h-4 mr-2.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>Continue with Google</span>
      </button>

      {/* LinkedIn Button */}
      <button
        type="button"
        onClick={() => handleOAuth('linkedin')}
        disabled={loadingProvider !== null}
        className="w-full flex items-center justify-center px-4 py-2.5 border border-[#0A66C2]/30 rounded-xl bg-white hover:bg-[#0A66C2]/5 text-xs font-semibold text-[#0A66C2] shadow-sm transition-all duration-150 disabled:opacity-60"
      >
        {loadingProvider === 'linkedin' ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#0A66C2]" />
        ) : (
          <svg className="w-4 h-4 mr-2.5 fill-current" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
          </svg>
        )}
        <span>Continue with LinkedIn</span>
      </button>
    </div>
  );
};
