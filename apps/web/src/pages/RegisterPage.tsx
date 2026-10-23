import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '@antigravite/types';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../lib/axios';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { SocialAuthButtons } from '../components/common/SocialAuthButtons';
import {
  User,
  Building2,
  Briefcase,
  Users,
  Megaphone,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const registerFormSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Must include at least one letter')
      .regex(/[0-9]/, 'Must include at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.nativeEnum(UserRole),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerFormSchema>;

interface RoleOption {
  role: UserRole;
  title: string;
  description: string;
  icon: React.ElementType;
}

const roleOptions: RoleOption[] = [
  {
    role: UserRole.CANDIDATE,
    title: 'Candidate',
    description: 'Find AI-matched opportunities tailored to your skills and salary goals.',
    icon: User,
  },
  {
    role: UserRole.COMPANY_OWNER,
    title: 'Company Owner',
    description: 'Build your company profile and hire top talent with AI-driven matching.',
    icon: Building2,
  },
  {
    role: UserRole.RECRUITER,
    title: 'Recruiter',
    description: 'Source and qualify pre-matched candidates for multiple clients.',
    icon: Briefcase,
  },
  {
    role: UserRole.HIRING_MANAGER,
    title: 'Hiring Manager',
    description: 'Review top candidate profiles, shortlist and streamline team hires.',
    icon: Users,
  },
  {
    role: UserRole.ADS_MANAGER,
    title: 'Ads Manager',
    description: 'Manage featured job campaigns and spotlight opportunities.',
    icon: Megaphone,
  },
  {
    role: UserRole.PLATFORM_ADMIN,
    title: 'Platform Admin',
    description: 'System administration, compliance, and platform oversight.',
    icon: ShieldCheck,
  },
];

export const RegisterPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CANDIDATE);
  const [serverError, setServerError] = useState<string | null>(null);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      role: UserRole.CANDIDATE,
    },
  });

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setValue('role', role, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const res = await apiClient.post('/auth/register', {
        email: data.email,
        password: data.password,
        role: data.role,
      });

      const authData = res.data.data;
      setAuth(authData);
      navigate('/onboarding');
    } catch (err: any) {
      setServerError(
        err.response?.data?.error?.message ||
          'Registration failed. Please check your information.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e2f7f9]/50 via-white to-white py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#d1f4f3] text-[#062224] text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#3eb8bb]" />
            <span>Join AntiGravite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#062224] tracking-tight">
            Create Your Account
          </h1>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Choose your role to get started with intelligent AI job matching
          </p>
        </div>

        {/* Role Picker Section */}
        <div className="mb-8">
          <label className="block text-xs font-bold text-[#062224] uppercase tracking-wider mb-3 text-center sm:text-left">
            Step 1: Select Your Role
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedRole === opt.role;
              return (
                <button
                  type="button"
                  key={opt.role}
                  onClick={() => handleRoleSelect(opt.role)}
                  className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 relative group flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#60d1d4] bg-[#e2f7f9] shadow-md shadow-[#60d1d4]/20 scale-[1.01]'
                      : 'border-gray-200 bg-white hover:border-[#b1f0ee] hover:bg-[#e2f7f9]/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#60d1d4] text-[#062224]'
                            : 'bg-gray-100 text-gray-600 group-hover:bg-[#d1f4f3]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-[#3eb8bb] bg-[#3eb8bb]'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <span className="w-1.5 h-1.5 bg-white rounded-full" />
                        )}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm text-[#062224]">
                      {opt.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Form Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl shadow-[#60d1d4]/10 max-w-xl mx-auto">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#062224]">
              Step 2: Sign Up as <span className="text-[#3eb8bb]">{selectedRole}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter your credentials or use quick single sign-on
            </p>
          </div>

          {serverError && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-600">
              {serverError}
            </div>
          )}

          {/* Social Auth Buttons */}
          <SocialAuthButtons role={selectedRole} mode="register" />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 font-semibold">
                Or with email
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('role')} />

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
              placeholder="At least 8 characters (letters & numbers)"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Onboarding
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-[#062224] hover:text-[#3eb8bb] underline decoration-[#60d1d4] decoration-2 underline-offset-4"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
