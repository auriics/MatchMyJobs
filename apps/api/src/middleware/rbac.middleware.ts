import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { sendError } from '../utils/response.util.js';

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthorized. Please log in first.', 401, 'UNAUTHORIZED');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Required: ${allowedRoles.join(', ')}`,
        403,
        'FORBIDDEN'
      );
      return;
    }

    next();
  };
}

// Convenient helper for company-side roles (Owner, Recruiter, Hiring Manager)
export const requireCompanyRole = requireRole(
  Role.COMPANY_OWNER,
  Role.RECRUITER,
  Role.HIRING_MANAGER,
  Role.PLATFORM_ADMIN
);

export const requireCandidateRole = requireRole(
  Role.CANDIDATE,
  Role.PLATFORM_ADMIN
);

export const requireAdminRole = requireRole(Role.PLATFORM_ADMIN);
