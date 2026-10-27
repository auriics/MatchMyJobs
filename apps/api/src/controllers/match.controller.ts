import { Request, Response } from 'express';
import { MatchService } from '../services/match.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export class MatchController {
  /**
   * POST /api/match/jobs
   * Score active jobs for candidate profile
   */
  static async matchJobs(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Authentication required', 401);
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const matches = await MatchService.matchJobsForCandidate(user.id, limit);

      return sendSuccess(res, matches, 'Jobs matched and scored successfully');
    } catch (error: any) {
      console.error('[MatchController.matchJobs] Error:', error);
      return sendError(res, error.message || 'Failed to match jobs', 500);
    }
  }

  /**
   * GET /api/match/jobs
   * Retrieve matched jobs for current candidate
   */
  static async getMyJobMatches(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Authentication required', 401);
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const matches = await MatchService.getCandidateMatches(user.id, limit);

      return sendSuccess(res, matches, 'Matched jobs retrieved successfully');
    } catch (error: any) {
      console.error('[MatchController.getMyJobMatches] Error:', error);
      return sendError(res, error.message || 'Failed to get matched jobs', 500);
    }
  }

  /**
   * POST /api/match/candidates
   * Score candidates for a specific job (Recruiter view)
   */
  static async matchCandidates(req: Request, res: Response) {
    try {
      const { jobId } = req.body;
      if (!jobId) {
        return sendError(res, 'jobId is required', 400);
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const matches = await MatchService.matchCandidatesForJob(jobId, limit);

      return sendSuccess(res, matches, 'Candidates scored successfully for job');
    } catch (error: any) {
      console.error('[MatchController.matchCandidates] Error:', error);
      return sendError(res, error.message || 'Failed to match candidates', 500);
    }
  }

  /**
   * GET /api/match/candidates/:jobId
   * Retrieve scored candidates for job
   */
  static async getCandidatesForJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const matches = await MatchService.matchCandidatesForJob(jobId, limit);

      return sendSuccess(res, matches, 'Top candidates retrieved for job');
    } catch (error: any) {
      console.error('[MatchController.getCandidatesForJob] Error:', error);
      return sendError(res, error.message || 'Failed to get candidate matches', 500);
    }
  }
}
