import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { config } from '../config/env.js';

const COOKIE_NAME = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: config.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000,
  path: '/',
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, role, companyName } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await AuthService.register(email, password, role, companyName, userAgent, ipAddress);

      // Set httpOnly cookie for web clients
      res.cookie(COOKIE_NAME, result.tokens.refreshToken, COOKIE_OPTIONS);

      sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        sendError(res, error.message, 409, 'USER_EXISTS');
        return;
      }
      if (error.message.includes('Privileged and company internal roles')) {
        sendError(res, error.message, 403, 'PRIVILEGED_ROLE_FORBIDDEN');
        return;
      }
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await AuthService.login(email, password, userAgent, ipAddress);

      // Set httpOnly cookie for web clients
      res.cookie(COOKIE_NAME, result.tokens.refreshToken, COOKIE_OPTIONS);

      sendSuccess(res, result, 'Login successful');
    } catch (error: any) {
      if (error.message.includes('Invalid email or password')) {
        sendError(res, error.message, 401, 'INVALID_CREDENTIALS');
        return;
      }
      if (error.message.includes('suspended')) {
        sendError(res, error.message, 403, 'ACCOUNT_SUSPENDED');
        return;
      }
      next(error);
    }
  }

  /**
   * Dedicated Platform Administration Login
   */
  static async adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, mfaCode } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await AuthService.adminLogin(email, password, mfaCode, userAgent, ipAddress);

      res.cookie(COOKIE_NAME, result.tokens.refreshToken, COOKIE_OPTIONS);

      sendSuccess(res, result, 'Administrator authentication successful');
    } catch (error: any) {
      if (error.message.includes('Invalid email or password')) {
        sendError(res, 'Invalid administrator credentials.', 401, 'INVALID_CREDENTIALS');
        return;
      }
      if (error.message.includes('suspended')) {
        sendError(res, error.message, 403, 'ADMIN_ACCOUNT_SUSPENDED');
        return;
      }
      if (error.message.includes('Multi-Factor')) {
        sendError(res, error.message, 401, 'MFA_REQUIRED');
        return;
      }
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token =
        req.cookies?.[COOKIE_NAME] ||
        req.body?.refreshToken ||
        (req.headers['x-refresh-token'] as string);

      if (!token) {
        sendError(res, 'Refresh token is required', 400, 'TOKEN_REQUIRED');
        return;
      }

      const result = await AuthService.refresh(token);

      res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

      sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error: any) {
      res.clearCookie(COOKIE_NAME, { path: '/' });
      sendError(res, error.message || 'Token refresh failed', 401, 'REFRESH_FAILED');
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token =
        req.cookies?.[COOKIE_NAME] ||
        req.body?.refreshToken ||
        (req.headers['x-refresh-token'] as string);

      await AuthService.logout(token, req.user?.id);

      res.clearCookie(COOKIE_NAME, { path: '/' });

      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  static async google(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, role } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await AuthService.googleAuth(token, role, userAgent, ipAddress);

      res.cookie(COOKIE_NAME, result.tokens.refreshToken, COOKIE_OPTIONS);

      sendSuccess(res, result, 'Google authentication successful');
    } catch (error: any) {
      sendError(res, error.message || 'Google authentication failed', 401, 'OAUTH_FAILED');
    }
  }

  static async linkedin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, role } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await AuthService.linkedinAuth(token, role, userAgent, ipAddress);

      res.cookie(COOKIE_NAME, result.tokens.refreshToken, COOKIE_OPTIONS);

      sendSuccess(res, result, 'LinkedIn authentication successful');
    } catch (error: any) {
      sendError(res, error.message || 'LinkedIn authentication failed', 401, 'OAUTH_FAILED');
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const result = await AuthService.getMe(req.user.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
