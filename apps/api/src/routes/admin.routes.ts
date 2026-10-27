import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import {
  requireAdminRole,
  requireSuperAdminRole,
  requireAdminPermission,
} from '../middleware/rbac.middleware.js';

const router = Router();

// All administrative endpoints require valid JWT authentication and admin status
router.use(authenticateJwt, requireAdminRole);

// Platform Overview
router.get(
  '/overview',
  requireAdminPermission('VIEW_REPORTS'),
  AdminController.getOverview
);

// Companies management
router.get(
  '/companies',
  requireAdminPermission('MANAGE_COMPANIES'),
  AdminController.getCompanies
);
router.post(
  '/companies',
  requireAdminPermission('MANAGE_COMPANIES'),
  AdminController.createCompany
);
router.patch(
  '/companies/:id/status',
  requireAdminPermission('MANAGE_COMPANIES'),
  AdminController.updateCompanyStatus
);

// Candidates management
router.get(
  '/candidates',
  requireAdminPermission('MANAGE_CANDIDATES'),
  AdminController.getCandidates
);

// Company Users management
router.get(
  '/company-users',
  requireAdminPermission('MANAGE_COMPANIES'),
  AdminController.getCompanyUsers
);

// User status & role modifications
router.patch(
  '/users/:id/status',
  requireAdminPermission('MANAGE_COMPANIES'),
  AdminController.updateUserStatus
);
router.patch(
  '/users/:id/role-org',
  requireSuperAdminRole,
  AdminController.updateUserRoleAndOrg
);

// Admin Managers & Platform Admins management (Restricted strictly to Super Administrator)
router.get('/admins', requireSuperAdminRole, AdminController.getAdminAccounts);
router.post('/admins', requireSuperAdminRole, AdminController.createAdminManager);
router.patch(
  '/admins/:id/permissions',
  requireSuperAdminRole,
  AdminController.updateAdminManagerPermissions
);

// Platform Jobs moderation
router.get('/jobs', requireAdminPermission('MANAGE_JOBS'), AdminController.getJobs);
router.patch(
  '/jobs/:id/status',
  requireAdminPermission('MANAGE_JOBS'),
  AdminController.updateJobStatus
);

// Advertising management
router.get(
  '/campaigns',
  requireAdminPermission('MANAGE_ADS'),
  AdminController.getCampaigns
);

// Audit logs
router.get(
  '/audit-logs',
  requireAdminPermission('VIEW_REPORTS'),
  AdminController.getAuditLogs
);

export default router;
