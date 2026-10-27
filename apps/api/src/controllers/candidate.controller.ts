import { Request, Response, NextFunction } from 'express';
import { CandidateService } from '../services/candidate.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export class CandidateController {
  static async browseJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, location, jobType, department, page, limit } = req.query;
      const result = await CandidateService.browseJobs({
        search: search as string,
        location: location as string,
        jobType: jobType as string,
        department: department as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async applyJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId, coverLetter, resumeUrl } = req.body;
      if (!jobId) {
        sendError(res, 'Job ID is required', 400, 'BAD_REQUEST');
        return;
      }
      const application = await CandidateService.applyJob(
        req.user!.id,
        jobId,
        coverLetter,
        resumeUrl
      );
      sendSuccess(res, application, 'Application submitted successfully', 201);
    } catch (error: any) {
      if (error.message.includes('already submitted')) {
        sendError(res, error.message, 409, 'ALREADY_APPLIED');
        return;
      }
      if (error.message.includes('no longer accepting')) {
        sendError(res, error.message, 400, 'JOB_CLOSED');
        return;
      }
      next(error);
    }
  }

  static async getMyApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const applications = await CandidateService.getMyApplications(req.user!.id);
      sendSuccess(res, applications);
    } catch (error) {
      next(error);
    }
  }

  static async toggleSaveJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.body;
      if (!jobId) {
        sendError(res, 'Job ID is required', 400, 'BAD_REQUEST');
        return;
      }
      const result = await CandidateService.toggleSaveJob(req.user!.id, jobId);
      sendSuccess(res, result, result.saved ? 'Job saved' : 'Job removed from saved');
    } catch (error) {
      next(error);
    }
  }

  static async getSavedJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const saved = await CandidateService.getSavedJobs(req.user!.id);
      sendSuccess(res, saved);
    } catch (error) {
      next(error);
    }
  }

  static async getMyInterviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const interviews = await CandidateService.getMyInterviews(req.user!.id);
      sendSuccess(res, interviews);
    } catch (error) {
      next(error);
    }
  }
}
