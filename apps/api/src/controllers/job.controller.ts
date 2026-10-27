import { Request, Response } from 'express';
import { JobService } from '../services/job.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export class JobController {
  /**
   * GET /api/jobs
   * Public list jobs with filters
   */
  static async listJobs(req: Request, res: Response) {
    try {
      const {
        keyword,
        search,
        location,
        type,
        workplaceType,
        minSalary,
        status,
        organizationId,
        page,
        limit,
      } = req.query;

      const result = await JobService.listJobs({
        keyword: keyword as string,
        search: search as string,
        location: location as string,
        type: type as string,
        workplaceType: workplaceType as string,
        minSalary: minSalary ? Number(minSalary) : undefined,
        status: status as string,
        organizationId: organizationId as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      return sendSuccess(res, result, 'Jobs retrieved successfully');
    } catch (error: any) {
      console.error('[JobController.listJobs] Error:', error);
      return sendError(res, error.message || 'Failed to list jobs', 500);
    }
  }

  /**
   * GET /api/jobs/:id
   * Public single job detail
   */
  static async getJobById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const job = await JobService.getJobById(id);

      if (!job) {
        return sendError(res, 'Job listing not found', 404);
      }

      return sendSuccess(res, job, 'Job details retrieved successfully');
    } catch (error: any) {
      console.error('[JobController.getJobById] Error:', error);
      return sendError(res, error.message || 'Failed to get job', 500);
    }
  }

  /**
   * POST /api/jobs
   * Create job listing (company role required)
   */
  static async createJob(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user || !user.organizationId) {
        return sendError(res, 'Authorized company organization account required', 403);
      }

      const {
        title,
        description,
        requirements,
        department,
        location,
        jobType,
        workplaceType,
        salaryMin,
        salaryMax,
        currency,
        status,
      } = req.body;

      if (!title || !description) {
        return sendError(res, 'Title and description are required', 400);
      }

      const job = await JobService.createJob(user.organizationId, user.id, {
        title,
        description,
        requirements: Array.isArray(requirements) ? requirements : [],
        department,
        location,
        jobType,
        workplaceType,
        salaryMin,
        salaryMax,
        currency,
        status,
      });

      return sendSuccess(res, job, 'Job created successfully', 201);
    } catch (error: any) {
      console.error('[JobController.createJob] Error:', error);
      return sendError(res, error.message || 'Failed to create job', 500);
    }
  }

  /**
   * PUT /api/jobs/:id
   * Edit job listing (company role required)
   */
  static async updateJob(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user || !user.organizationId) {
        return sendError(res, 'Authorized company organization account required', 403);
      }

      const { id } = req.params;
      const updated = await JobService.updateJob(user.organizationId, id, req.body);

      return sendSuccess(res, updated, 'Job updated successfully');
    } catch (error: any) {
      console.error('[JobController.updateJob] Error:', error);
      if (error.message?.includes('not found')) {
        return sendError(res, error.message, 404);
      }
      return sendError(res, error.message || 'Failed to update job', 500);
    }
  }

  /**
   * DELETE /api/jobs/:id
   * Soft delete job listing (sets status: archived)
   */
  static async deleteJob(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user || !user.organizationId) {
        return sendError(res, 'Authorized company organization account required', 403);
      }

      const { id } = req.params;
      const archived = await JobService.archiveJob(user.organizationId, id);

      return sendSuccess(res, archived, 'Job archived successfully');
    } catch (error: any) {
      console.error('[JobController.deleteJob] Error:', error);
      if (error.message?.includes('not found')) {
        return sendError(res, error.message, 404);
      }
      return sendError(res, error.message || 'Failed to archive job', 500);
    }
  }
}
