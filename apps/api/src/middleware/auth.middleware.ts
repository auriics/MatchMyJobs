import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util.js';
import { prisma } from '../config/prisma.js';
import { redisClient } from '../config/redis.js';
import { sendError } from '../utils/response.util.js';
import { Role } from '@prisma/client';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export async function authenticateJwt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authentication required. No token provided.', 401, 'UNAUTHORIZED');
      return;
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      sendError(res, 'Invalid authorization format.', 401, 'UNAUTHORIZED');
      return;
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      sendError(res, 'Invalid or expired access token.', 401, 'TOKEN_EXPIRED');
      return;
    }

    // Optional check in cache for quick lookup
    const cacheKey = `user:${payload.userId}`;
    const cachedUser = await redisClient.get(cacheKey);

    if (cachedUser) {
      try {
        req.user = JSON.parse(cachedUser);
        next();
        return;
      } catch {
        // Fall back to database
      }
    }

    // Look up in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      sendError(res, 'User not found or account deactivated.', 401, 'USER_NOT_FOUND');
      return;
    }

    const userPayload: AuthUserPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };

    // Cache user payload for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(userPayload), 'EX', 300);

    req.user = userPayload;
    next();
  } catch (error) {
    sendError(res, 'Authentication failed.', 401, 'AUTH_FAILED');
  }
}
