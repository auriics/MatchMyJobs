import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'Invalid user role selected' }),
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export const oauthSchema = z.object({
  provider: z.enum(['google', 'linkedin']),
  token: z.string().min(1, 'Token or authorization code is required'),
  role: z.nativeEnum(Role).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type OAuthInput = z.infer<typeof oauthSchema>;
