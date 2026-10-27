import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../services/company.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export class CompanyController {
  // ==========================================
  // RECRUITER ENDPOINTS
  // ==========================================

  static async getJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const jobs = await CompanyService.getJobs(orgId);
      sendSuccess(res, jobs);
    } catch (error) {
      next(error);
    }
  }

  static async createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const job = await CompanyService.createJob(orgId, req.user!.id, req.body);
      sendSuccess(res, job, 'Job created and published successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const { id } = req.params;
      const job = await CompanyService.updateJob(orgId, id, req.body);
      sendSuccess(res, job, 'Job updated successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendError(res, error.message, 404, 'NOT_FOUND');
        return;
      }
      next(error);
    }
  }

  static async getApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const { jobId, status } = req.query;
      const applications = await CompanyService.getApplications(
        orgId,
        jobId as string,
        status as string
      );
      sendSuccess(res, applications);
    } catch (error) {
      next(error);
    }
  }

  static async updateApplicationStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const { id } = req.params;
      const { status, stageNotes } = req.body;
      if (!status) {
        sendError(res, 'New status stage is required', 400, 'BAD_REQUEST');
        return;
      }
      const updated = await CompanyService.updateApplicationStage(
        orgId,
        id,
        status,
        stageNotes,
        req.user?.id
      );
      sendSuccess(res, updated, `Candidate moved to ${status} stage`);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendError(res, error.message, 404, 'NOT_FOUND');
        return;
      }
      next(error);
    }
  }

  static async scheduleInterview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const { applicationId, interviewerId, scheduledAt, durationMinutes, meetingUrl } = req.body;
      if (!applicationId || !interviewerId || !scheduledAt) {
        sendError(res, 'Application ID, Interviewer ID, and scheduled date/time are required', 400, 'BAD_REQUEST');
        return;
      }
      const interview = await CompanyService.scheduleInterview(
        orgId,
        { applicationId, interviewerId, scheduledAt, durationMinutes, meetingUrl },
        req.user?.id
      );
      sendSuccess(res, interview, 'Interview scheduled successfully', 201);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendError(res, error.message, 404, 'NOT_FOUND');
        return;
      }
      next(error);
    }
  }

  static async getRecruiterStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const stats = await CompanyService.getRecruiterStats(orgId);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // HIRING MANAGER ENDPOINTS
  // ==========================================

  static async getAssignedJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const jobs = await CompanyService.getAssignedJobs(orgId, req.user!.id);
      sendSuccess(res, jobs);
    } catch (error) {
      next(error);
    }
  }

  static async getShortlistedCandidates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      // Recruiter or company owner can see all, hiring manager sees assigned
      const filterByHiringManager = req.user!.role === 'HIRING_MANAGER' ? req.user!.id : undefined;
      const candidates = await CompanyService.getShortlistedCandidates(orgId, filterByHiringManager);
      sendSuccess(res, candidates);
    } catch (error) {
      next(error);
    }
  }

  static async submitEvaluation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const { applicationId, feedback, rating, recommendation } = req.body;
      if (!applicationId || !feedback || rating === undefined || !recommendation) {
        sendError(res, 'Application ID, feedback evaluation, numerical rating, and recommendation are required', 400, 'BAD_REQUEST');
        return;
      }
      const updated = await CompanyService.submitInterviewEvaluation(
        orgId,
        applicationId,
        req.user!.id,
        feedback,
        Number(rating),
        recommendation
      );
      sendSuccess(res, updated, 'Candidate evaluation recorded successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendError(res, error.message, 404, 'NOT_FOUND');
        return;
      }
      next(error);
    }
  }

  static async submitHiringDecision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const { applicationId, decision } = req.body;
      if (!applicationId || !decision || (decision !== 'OFFERED' && decision !== 'REJECTED')) {
        sendError(res, 'Decision must be OFFERED or REJECTED', 400, 'BAD_REQUEST');
        return;
      }
      const updated = await CompanyService.submitHiringDecision(
        orgId,
        applicationId,
        decision,
        req.user!.id
      );
      sendSuccess(res, updated, `Hiring decision '${decision}' executed successfully`);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendError(res, error.message, 404, 'NOT_FOUND');
        return;
      }
      next(error);
    }
  }

  static async getHiringManagerStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const filterByHiringManager = req.user!.role === 'HIRING_MANAGER' ? req.user!.id : undefined;
      const stats = await CompanyService.getHiringManagerStats(orgId, filterByHiringManager);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADS MANAGER ENDPOINTS
  // ==========================================

  static async getCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const campaigns = await CompanyService.getCampaigns(orgId);
      sendSuccess(res, campaigns);
    } catch (error) {
      next(error);
    }
  }

  static async createCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const campaign = await CompanyService.createCampaign(orgId, req.user!.id, req.body);
      sendSuccess(res, campaign, 'Recruitment advertising campaign launched successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateCampaignStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const { id } = req.params;
      const { status } = req.body;
      if (!status || !['ACTIVE', 'PAUSED', 'COMPLETED'].includes(status)) {
        sendError(res, 'Invalid campaign status', 400, 'BAD_REQUEST');
        return;
      }
      const updated = await CompanyService.updateCampaignStatus(orgId, id, status, req.user?.id);
      sendSuccess(res, updated, `Campaign status set to ${status}`);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendError(res, error.message, 404, 'NOT_FOUND');
        return;
      }
      next(error);
    }
  }

  static async getAdsAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const analytics = await CompanyService.getAdsAnalytics(orgId);
      sendSuccess(res, analytics);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // COMPANY TEAM & INVITATION ENDPOINTS
  // ==========================================

  static async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const members = await CompanyService.getMembers(orgId);
      sendSuccess(res, members);
    } catch (error) {
      next(error);
    }
  }

  static async inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const { email, role } = req.body;
      if (!email || !role) {
        sendError(res, 'Email and company role are required', 400, 'BAD_REQUEST');
        return;
      }
      const invitation = await CompanyService.inviteMember(orgId, email, role, req.user?.id);
      sendSuccess(res, invitation, 'Team member invitation generated successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400, 'INVITATION_FAILED');
    }
  }

  static async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const { id } = req.params;
      const result = await CompanyService.removeMember(orgId, id, req.user?.id);
      sendSuccess(res, result, 'Team member removed from organization');
    } catch (error: any) {
      sendError(res, error.message, 400, 'REMOVAL_FAILED');
    }
  }

  // ==========================================
  // COMPANY PROFILE (GET & PUT)
  // ==========================================

  static async getCompanyProfile(req: Request, res: Response): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const profile = await CompanyService.getCompanyProfile(orgId);
      sendSuccess(res, profile, 'Company profile retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 404, 'NOT_FOUND');
    }
  }

  static async updateCompanyProfile(req: Request, res: Response): Promise<void> {
    try {
      const orgId = req.user!.organizationId!;
      const logoFile = req.file
        ? {
            buffer: req.file.buffer,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
          }
        : undefined;

      const updated = await CompanyService.updateCompanyProfile(
        orgId,
        req.body,
        logoFile
      );
      sendSuccess(res, updated, 'Company profile updated successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update company profile', 500);
    }
  }
}
