import { Request, Response } from 'express';
import { ResumeService } from '../services/resume.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { prisma } from '../config/prisma.js';

export class ResumeController {
  /**
   * POST /api/resume/upload
   * Upload resume document (PDF/DOCX)
   */
  static async uploadResume(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Authentication required', 401);
      }

      const file = req.file;
      if (!file) {
        return sendError(res, 'No resume document provided. Please attach a PDF or DOCX file.', 400);
      }

      const resume = await ResumeService.uploadResume(
        user.id,
        file.buffer,
        file.originalname,
        file.mimetype
      );

      return sendSuccess(
        res,
        {
          resumeId: resume.id,
          fileName: resume.fileName,
          fileUrl: resume.fileUrl,
          fileSize: resume.fileSize,
          mimeType: resume.mimeType,
          createdAt: resume.createdAt,
        },
        'Resume uploaded successfully',
        201
      );
    } catch (error: any) {
      console.error('[ResumeController.uploadResume] Error:', error);
      return sendError(res, error.message || 'Failed to upload resume', 500);
    }
  }

  /**
   * POST /api/resume/parse
   * Parse resume document with AI, save extracted details to candidate profile, and return structured JSON
   */
  static async parseResume(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Authentication required', 401);
      }

      // Case A: File uploaded directly in request
      if (req.file) {
        const file = req.file;
        const result = await ResumeService.parseAndSaveResume(
          user.id,
          file.buffer,
          file.originalname,
          file.mimetype
        );

        return sendSuccess(
          res,
          {
            resumeId: result.resume.id,
            fileUrl: result.resume.fileUrl,
            parsedData: result.parsedData,
            profile: result.profile,
          },
          'Resume parsed and profile updated successfully'
        );
      }

      // Case B: Existing resumeId provided in body
      const { resumeId, rawText } = req.body;

      if (rawText && typeof rawText === 'string') {
        const parsedData = await ResumeService.parseResumeText(rawText);

        const profile = await prisma.candidateProfile.upsert({
          where: { userId: user.id },
          update: {
            phone: parsedData.phone || undefined,
            headline: parsedData.summary ? parsedData.summary.slice(0, 120) : undefined,
            bio: parsedData.summary || undefined,
            skills: { set: Array.from(new Set(parsedData.skills)) },
            experience: parsedData.experience as any,
            education: parsedData.education as any,
            languages: parsedData.languages,
            certifications: parsedData.certifications,
          },
          create: {
            userId: user.id,
            fullName: parsedData.name || 'Candidate',
            headline: parsedData.summary ? parsedData.summary.slice(0, 120) : 'Job Candidate',
            bio: parsedData.summary || '',
            skills: parsedData.skills,
            experience: parsedData.experience as any,
            education: parsedData.education as any,
            languages: parsedData.languages,
            certifications: parsedData.certifications,
          },
        });

        return sendSuccess(
          res,
          { parsedData, profile },
          'Resume text parsed and profile updated successfully'
        );
      }

      if (resumeId) {
        const resume = await prisma.resume.findFirst({
          where: { id: resumeId, candidateId: user.id },
        });

        if (!resume) {
          return sendError(res, 'Resume not found', 404);
        }

        if (resume.parsedData) {
          return sendSuccess(
            res,
            { resumeId: resume.id, fileUrl: resume.fileUrl, parsedData: resume.parsedData },
            'Resume parsed data retrieved'
          );
        }
      }

      return sendError(
        res,
        'Please upload a resume file (.pdf, .docx) or provide raw resume text to parse.',
        400
      );
    } catch (error: any) {
      console.error('[ResumeController.parseResume] Error:', error);
      return sendError(res, error.message || 'Failed to parse resume', 500);
    }
  }

  /**
   * GET /api/resume
   * Get candidate's uploaded resumes
   */
  static async getResumes(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Authentication required', 401);
      }

      const resumes = await ResumeService.getCandidateResumes(user.id);
      return sendSuccess(res, resumes, 'Resumes retrieved successfully');
    } catch (error: any) {
      console.error('[ResumeController.getResumes] Error:', error);
      return sendError(res, error.message || 'Failed to get resumes', 500);
    }
  }
}
