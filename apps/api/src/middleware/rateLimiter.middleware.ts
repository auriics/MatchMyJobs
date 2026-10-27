import rateLimit from 'express-rate-limit';
import { ApiResponse } from '@antigravite/types';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      code: 'TOO_MANY_REQUESTS',
    },
  } as ApiResponse,
});

/**
 * Strict rate limiting for the dedicated platform administration portal
 * Protects against brute-force and credential stuffing attacks
 */
export const adminAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many administrative login attempts. For security reasons, this endpoint is locked for 15 minutes.',
      code: 'ADMIN_AUTH_RATE_LIMITED',
    },
  } as ApiResponse,
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});
