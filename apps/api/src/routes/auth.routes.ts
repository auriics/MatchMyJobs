import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  oauthSchema,
} from '../schemas/auth.schema.js';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  AuthController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  AuthController.login
);

router.post(
  '/refresh',
  authRateLimiter,
  validateBody(refreshTokenSchema),
  AuthController.refresh
);

router.post('/logout', AuthController.logout);

router.post(
  '/google',
  authRateLimiter,
  validateBody(oauthSchema),
  AuthController.google
);

router.post(
  '/linkedin',
  authRateLimiter,
  validateBody(oauthSchema),
  AuthController.linkedin
);

router.get('/me', authenticateJwt, AuthController.me);

export default router;
