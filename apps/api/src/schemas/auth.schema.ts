import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z
    .nativeEnum(Role, {
      errorMap: () => ({ message: 'Invalid user role selected' }),
    })
    .refine(
      (role) => role === Role.CANDIDATE || role === Role.COMPANY_OWNER,
      {
        message:
          'Public registration is only permitted for Candidates and Company accounts. Staff and Administrator accounts require secure provisioning or organization invitations.',
      }
    ),
  companyName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid administrator email address'),
  password: z.string().min(1, 'Password is required'),
  mfaCode: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export const oauthSchema = z.object({
  provider: z.enum(['google', 'linkedin']),
  token: z.string().min(1, 'Token or authorization code is required'),
  role: z
    .nativeEnum(Role)
    .refine(
      (role) => !role || role === Role.CANDIDATE || role === Role.COMPANY_OWNER,
      {
        message:
          'Social registration is only allowed for Candidates and Company accounts.',
      }
    )
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type OAuthInput = z.infer<typeof oauthSchema>;
