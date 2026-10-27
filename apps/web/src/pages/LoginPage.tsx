import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../lib/axios';
import { UserRole } from '@antigravite/types';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { SocialAuthButtons } from '../components/common/SocialAuthButtons';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';

const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export const LoginPage: React.FC = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const res = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const authData = res.data.data;
      setAuth(authData);

      if (!authData.hasProfile && authData.user.role === UserRole.CANDIDATE) {
        navigate('/onboarding');
        return;
      }

      if (from && from !== '/login') {
        navigate(from);
        return;
      }

      // Smart role-based dashboard redirection
      if (
        authData.user.role === UserRole.PLATFORM_ADMIN ||
        authData.user.role === UserRole.ADMIN_MANAGER
      ) {
        navigate('/platform-admin/dashboard');
      } else if (authData.user.role === UserRole.CANDIDATE) {
        navigate('/candidate/dashboard');
      } else {
        navigate('/company/dashboard');
      }
    } catch (err: any) {
      setServerError(
        err.response?.data?.error?.message ||
          'Invalid email or password. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e2f7f9]/50 via-white to-white py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#d1f4f3] text-[#062224] text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#3eb8bb]" />
            <span>Welcome Back</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#062224] tracking-tight">
            Sign In to MatchMyJobs
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Access your Candidate or Company recruitment dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl shadow-[#60d1d4]/10">
          {serverError && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-600">
              {serverError}
            </div>
          )}

          {/* Social Auth */}
          <SocialAuthButtons mode="login" />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 font-semibold">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-[#60d1d4] focus:ring-[#60d1d4] mr-2"
                />
                Remember me
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Password reset link has been dispatched in dev mode.');
                }}
                className="font-medium text-[#062224] hover:text-[#3eb8bb]"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-[#062224] hover:text-[#3eb8bb] underline decoration-[#60d1d4] decoration-2 underline-offset-4"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
