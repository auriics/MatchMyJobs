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
  status: string;
  isEmailVerified: boolean;
  organizationId?: string | null;
  adminPermissions: string[];
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

    // Look up in cache for quick lookup
    const cacheKey = `user:${payload.userId}`;
    const cachedUser = await redisClient.get(cacheKey);

    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser) as AuthUserPayload;
        if (parsed.status === 'SUSPENDED' || parsed.status === 'DEACTIVATED') {
          sendError(res, 'Your account has been suspended or deactivated. Contact support.', 403, 'ACCOUNT_SUSPENDED');
          return;
        }
        req.user = parsed;
        next();
        return;
      } catch {
        // Fall back to database query
      }
    }

    // Look up in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isEmailVerified: true,
        organizationId: true,
        adminPermissions: true,
        organization: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      sendError(res, 'User not found or account deactivated.', 401, 'USER_NOT_FOUND');
      return;
    }

    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      sendError(res, 'Your account has been suspended or deactivated. Contact platform administration.', 403, 'ACCOUNT_SUSPENDED');
      return;
    }

    // Check organization status if user is in a company
    if (
      user.organization &&
      user.organization.status === 'SUSPENDED' &&
      user.role !== Role.PLATFORM_ADMIN &&
      user.role !== Role.ADMIN_MANAGER
    ) {
      sendError(res, 'Your organization has been suspended. Please contact platform administration.', 403, 'ORGANIZATION_SUSPENDED');
      return;
    }

    const userPayload: AuthUserPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      organizationId: user.organizationId,
      adminPermissions: user.adminPermissions || [],
    };

    // Cache user payload for 3 minutes
    await redisClient.set(cacheKey, JSON.stringify(userPayload), 'EX', 180);

    req.user = userPayload;
    next();
  } catch (error) {
    sendError(res, 'Authentication failed.', 401, 'AUTH_FAILED');
  }
}
