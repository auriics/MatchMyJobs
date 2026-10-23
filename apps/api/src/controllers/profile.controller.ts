import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service.js';
import { StorageService } from '../services/storage.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { Role } from '@prisma/client';

export class ProfileController {
  /**
   * POST /profile/candidate
   */
  static async createCandidate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const profile = await ProfileService.createCandidateProfile(req.user.id, req.body);
      sendSuccess(res, profile, 'Candidate profile created successfully', 201);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        sendError(res, error.message, 409, 'PROFILE_EXISTS');
        return;
      }
      next(error);
    }
  }

  /**
   * PUT /profile/candidate
   */
  static async updateCandidate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const profile = await ProfileService.updateCandidateProfile(req.user.id, req.body);
      sendSuccess(res, profile, 'Candidate profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /profile/candidate/:id
   */
  static async getCandidateById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const profile = await ProfileService.getCandidateProfile(id);
      sendSuccess(res, profile);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendError(res, error.message, 404, 'NOT_FOUND');
        return;
      }
      next(error);
    }
  }

  /**
   * POST /profile/company
   */
  static async createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const profile = await ProfileService.createCompanyProfile(req.user.id, req.body);
      sendSuccess(res, profile, 'Company profile created successfully', 201);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        sendError(res, error.message, 409, 'PROFILE_EXISTS');
        return;
      }
      next(error);
    }
  }

  /**
   * PUT /profile/company
   */
  static async updateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const profile = await ProfileService.updateCompanyProfile(req.user.id, req.body);
      sendSuccess(res, profile, 'Company profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /profile/company/:id
   */
  static async getCompanyById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const profile = await ProfileService.getCompanyProfile(id);
      sendSuccess(res, profile);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendError(res, error.message, 404, 'NOT_FOUND');
        return;
      }
      next(error);
    }
  }

  /**
   * POST /profile/avatar
   * Handles multipart avatar uploads, or pre-signed URL requests
   */
  static async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      // Check if this is a request for a presigned S3 upload URL (e.g. { getPresignedUrl: true, filename: 'avatar.png', mimeType: 'image/png' })
      if (req.body?.getPresignedUrl) {
        const { filename = 'avatar.png', mimeType = 'image/jpeg' } = req.body;
        const presigned = await StorageService.getPresignedUploadUrl(filename, mimeType);
        sendSuccess(res, presigned, 'Presigned URL generated successfully');
        return;
      }

      // Check if file was uploaded via multipart/form-data
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        sendError(res, 'No avatar image file was provided', 400, 'FILE_MISSING');
        return;
      }

      const host = req.get('host') || 'localhost:5001';
      const protocol = req.protocol || 'http';
      const baseUrl = `${protocol}://${host}`;

      const result = await StorageService.uploadAvatar(
        file.buffer,
        file.originalname,
        file.mimetype,
        baseUrl
      );

      // Auto-update user's avatar in candidate or company profile if profile exists
      if (req.user.role === Role.CANDIDATE) {
        try {
          await ProfileService.updateCandidateProfile(req.user.id, {
            avatarUrl: result.avatarUrl,
          });
        } catch {
          // If candidate profile not initialized yet, that's fine - returned URL will be used in onboarding
        }
      } else {
        try {
          await ProfileService.updateCompanyProfile(req.user.id, {
            logoUrl: result.avatarUrl,
          });
        } catch {
          // Company profile not initialized yet
        }
      }

      sendSuccess(res, result, 'Avatar uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /profile/me
   */
  static async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const profile = await ProfileService.getMyProfile(req.user.id);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }
}
