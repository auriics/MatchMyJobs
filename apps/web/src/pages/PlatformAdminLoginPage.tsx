import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../lib/axios';
import { Button } from '../components/common/Button';
import {
  ShieldAlert,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';

const adminLoginFormSchema = z.object({
  email: z.string().email('Please enter a valid administrator email'),
  password: z.string().min(1, 'Password is required'),
  mfaCode: z.string().optional(),
});

type AdminLoginFormData = z.infer<typeof adminLoginFormSchema>;

export const PlatformAdminLoginPage: React.FC = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showMfa, setShowMfa] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginFormSchema),
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    setServerError(null);
    try {
      const res = await apiClient.post('/auth/admin/login', {
        email: data.email,
        password: data.password,
        mfaCode: data.mfaCode,
      });

      const authData = res.data.data;
      setAuth(authData);

      navigate('/platform-admin/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message;
      if (msg && msg.includes('Multi-Factor')) {
        setShowMfa(true);
        setServerError('Multi-Factor Authentication code is required.');
      } else {
        setServerError(
          msg || 'Invalid administrator credentials. Access attempt has been recorded in the security audit log.'
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Security Grid Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Decorative ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#269194]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md mx-auto w-full relative z-10">
        {/* Top Back Link */}
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center text-xs text-slate-400 hover:text-[#60d1d4] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Public Portal
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-[#60d1d4] text-xs font-mono font-medium mb-4 shadow-inner">
            <ShieldAlert className="w-3.5 h-3.5 text-[#60d1d4]" />
            <span>RESTRICTED PLATFORM COMMAND</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Platform Administration
          </h1>
          <p className="mt-2 text-xs text-slate-400">
            Authorized administrative access for JobMatch Platform Operators
          </p>
        </div>

        {/* Security Warning Banner */}
        <div className="mb-6 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="leading-relaxed">
            <span className="font-semibold text-amber-200">Security Warning:</span> All login attempts, sessions, and client IPs are recorded in the tamper-resistant security audit log.
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl shadow-black/80">
          {serverError && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs font-medium text-red-300 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="admin@jobmatch.internal"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#60d1d4] focus:ring-1 focus:ring-[#60d1d4]"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#60d1d4] focus:ring-1 focus:ring-[#60d1d4]"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Optional / Dynamic MFA Code */}
            {showMfa && (
              <div>
                <label className="block text-xs font-medium text-amber-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>MFA Authenticator Code</span>
                  <span className="text-[10px] text-slate-400">TOTP (6-digits)</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-4 py-2.5 pl-10 text-sm font-mono tracking-widest text-amber-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    {...register('mfaCode')}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4 bg-gradient-to-r from-[#269194] to-[#60d1d4] text-slate-950 font-bold hover:brightness-110 border-0"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Verify & Enter Console
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
            Platform Administrator and Admin Manager access only.
          </div>
        </div>
      </div>
    </div>
  );
};
