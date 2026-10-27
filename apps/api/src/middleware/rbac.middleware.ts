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

/**
 * Super Administrator with unrestricted platform powers
 */
export const requireSuperAdminRole = requireRole(Role.PLATFORM_ADMIN);

/**
 * Platform Administration (Platform Admin OR Admin Manager)
 */
export const requireAdminRole = requireRole(
  Role.PLATFORM_ADMIN,
  Role.ADMIN_MANAGER
);

/**
 * Check specific Admin Manager permission. Super Admin always bypasses.
 */
export function requireAdminPermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthorized. Please log in first.', 401, 'UNAUTHORIZED');
      return;
    }

    // Platform Super Admin has unrestricted permissions across all operational areas
    if (req.user.role === Role.PLATFORM_ADMIN) {
      next();
      return;
    }

    if (req.user.role === Role.ADMIN_MANAGER) {
      const hasPermission = req.user.adminPermissions?.includes(permission);
      if (hasPermission) {
        next();
        return;
      }

      sendError(
        res,
        `Forbidden: Admin Manager account lacks explicit permission '${permission}'.`,
        403,
        'INSUFFICIENT_ADMIN_PERMISSIONS'
      );
      return;
    }

    sendError(
      res,
      'Forbidden: Administrative privileges required.',
      403,
      'FORBIDDEN'
    );
  };
}

/**
 * Company Organization multi-tenant validation.
 * Verifies that the authenticated user is bound to an active company organization.
 */
export function requireOrgMembership(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    sendError(res, 'Unauthorized. Please log in first.', 401, 'UNAUTHORIZED');
    return;
  }

  // Admins can inspect cross-organization resources
  if (req.user.role === Role.PLATFORM_ADMIN || req.user.role === Role.ADMIN_MANAGER) {
    next();
    return;
  }

  if (!req.user.organizationId) {
    sendError(
      res,
      'Forbidden: Your account is not currently associated with an active company organization.',
      403,
      'NO_ORGANIZATION'
    );
    return;
  }

  next();
}

/**
 * Ensure the requested organizationId matches the authenticated user's organizationId
 */
export function verifyOrganizationOwnership(userOrgId?: string | null, targetOrgId?: string | null): boolean {
  if (!targetOrgId) return false;
  return userOrgId === targetOrgId;
}

// Convenient helpers for standard application personas
export const requireCompanyRole = requireRole(
  Role.COMPANY_OWNER,
  Role.RECRUITER,
  Role.HIRING_MANAGER,
  Role.ADS_MANAGER,
  Role.PLATFORM_ADMIN
);

export const requireCompanyOwnerRole = requireRole(
  Role.COMPANY_OWNER,
  Role.PLATFORM_ADMIN
);

export const requireRecruiterRole = requireRole(
  Role.COMPANY_OWNER,
  Role.RECRUITER,
  Role.PLATFORM_ADMIN
);

export const requireHiringManagerRole = requireRole(
  Role.COMPANY_OWNER,
  Role.RECRUITER,
  Role.HIRING_MANAGER,
  Role.PLATFORM_ADMIN
);

export const requireAdsManagerRole = requireRole(
  Role.COMPANY_OWNER,
  Role.ADS_MANAGER,
  Role.PLATFORM_ADMIN
);

export const requireCandidateRole = requireRole(
  Role.CANDIDATE,
  Role.PLATFORM_ADMIN
);
