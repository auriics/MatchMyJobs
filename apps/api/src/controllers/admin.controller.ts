import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service.js';
import { AuditService } from '../services/audit.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export class AdminController {
  static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await AdminService.getOverviewStats();
      sendSuccess(res, stats, 'Platform overview statistics retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, status } = req.query;
      const result = await AdminService.getCompanies({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        status: status as string,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, industry, website, location, size, description } = req.body;
      if (!name) {
        sendError(res, 'Company name is required', 400, 'BAD_REQUEST');
        return;
      }
      const company = await AdminService.createCompany(
        { name, industry, website, location, size, description },
        req.user?.id
      );
      sendSuccess(res, company, 'Company organization created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateCompanyStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status || (status !== 'ACTIVE' && status !== 'SUSPENDED')) {
        sendError(res, 'Invalid company status. Must be ACTIVE or SUSPENDED.', 400, 'BAD_REQUEST');
        return;
      }
      const company = await AdminService.updateCompanyStatus(id, status, req.user?.id);
      sendSuccess(res, company, `Company status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  static async getCandidates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, status } = req.query;
      const result = await AdminService.getCandidates({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        status: status as string,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getCompanyUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { organizationId, role, search, page, limit } = req.query;
      const result = await AdminService.getCompanyUsers({
        organizationId: organizationId as string,
        role: role as any,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status || !['ACTIVE', 'SUSPENDED', 'DEACTIVATED'].includes(status)) {
        sendError(res, 'Invalid user status.', 400, 'BAD_REQUEST');
        return;
      }
      const updated = await AdminService.updateUserStatus(id, status, req.user?.id);
      sendSuccess(res, updated, `User account marked as ${status}`);
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRoleAndOrg(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role, organizationId } = req.body;
      const updated = await AdminService.updateUserRoleAndOrg(id, { role, organizationId }, req.user?.id);
      sendSuccess(res, updated, 'User role and organization assignment updated');
    } catch (error) {
      next(error);
    }
  }

  static async getAdminAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admins = await AdminService.getAdminAccounts();
      sendSuccess(res, admins);
    } catch (error) {
      next(error);
    }
  }

  static async createAdminManager(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, permissions } = req.body;
      if (!email || !password) {
        sendError(res, 'Email and password are required', 400, 'BAD_REQUEST');
        return;
      }
      const newAdmin = await AdminService.createAdminManager(
        { email, passwordPlain: password, permissions: permissions || [] },
        req.user?.id
      );
      sendSuccess(res, newAdmin, 'Admin Manager account created successfully', 201);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        sendError(res, error.message, 409, 'USER_EXISTS');
        return;
      }
      next(error);
    }
  }

  static async updateAdminManagerPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      if (!Array.isArray(permissions)) {
        sendError(res, 'Permissions must be an array of strings', 400, 'BAD_REQUEST');
        return;
      }
      const updated = await AdminService.updateAdminManagerPermissions(id, permissions, req.user?.id);
      sendSuccess(res, updated, 'Admin Manager permissions updated successfully');
    } catch (error: any) {
      if (error.message.includes('Cannot restrict')) {
        sendError(res, error.message, 403, 'FORBIDDEN');
        return;
      }
      next(error);
    }
  }

  static async getJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, status, search } = req.query;
      const result = await AdminService.getPlatformJobs({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        status: status as string,
        search: search as string,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateJobStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await AdminService.updateJobStatus(id, status, req.user?.id);
      sendSuccess(res, updated, `Job status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  static async getCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, status } = req.query;
      const result = await AdminService.getPlatformCampaigns({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        status: status as string,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, action, resource, userId } = req.query;
      const p = page ? parseInt(page as string, 10) : 1;
      const l = limit ? parseInt(limit as string, 10) : 50;
      const result = await AuditService.getLogs({
        limit: l,
        offset: (p - 1) * l,
        action: action as string,
        resource: resource as string,
        userId: userId as string,
      });
      sendSuccess(res, { ...result, page: p, limit: l });
    } catch (error) {
      next(error);
    }
  }
}
