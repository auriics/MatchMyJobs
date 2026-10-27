import { prisma } from '../config/prisma.js';
import { AuditService } from './audit.service.js';

export class CandidateService {
  /**
   * Search and browse published jobs with company details
   */
  static async browseJobs(options: {
    search?: string;
    location?: string;
    jobType?: string;
    department?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, options.limit || 20);
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'PUBLISHED',
      organization: { status: 'ACTIVE' },
    };

    if (options.jobType) where.jobType = options.jobType;
    if (options.department) where.department = options.department;
    if (options.location) {
      where.location = { contains: options.location, mode: 'insensitive' };
    }
    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
        { organization: { name: { contains: options.search, mode: 'insensitive' } } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          organization: {
            select: { id: true, name: true, logoUrl: true, location: true, industry: true },
          },
        },
        orderBy: [{ isPromoted: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return {
      jobs: jobs.map((j) => ({
        id: j.id,
        organizationId: j.organizationId,
        organizationName: j.organization?.name,
        organizationLogo: j.organization?.logoUrl,
        organizationLocation: j.organization?.location,
        organizationIndustry: j.organization?.industry,
        title: j.title,
        description: j.description,
        requirements: j.requirements,
        department: j.department,
        location: j.location,
        jobType: j.jobType,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        currency: j.currency,
        isPromoted: j.isPromoted,
        createdAt: j.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Candidate applies to an open job
   */
  static async applyJob(
    candidateUserId: string,
    jobId: string,
    coverLetter?: string,
    resumeUrl?: string
  ) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { organization: true },
    });

    if (!job || job.status !== 'PUBLISHED') {
      throw new Error('This job is no longer accepting applications.');
    }

    // Check for existing application
    const existing = await prisma.application.findUnique({
      where: {
        jobId_candidateId: { jobId, candidateId: candidateUserId },
      },
    });

    if (existing) {
      throw new Error('You have already submitted an application for this position.');
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        candidateId: candidateUserId,
        coverLetter,
        resumeUrl,
        status: 'APPLIED',
      },
    });

    await AuditService.log({
      userId: candidateUserId,
      action: 'CANDIDATE_JOB_APPLIED',
      resource: 'APPLICATION',
      resourceId: application.id,
      details: { jobId, organizationId: job.organizationId, title: job.title },
    });

    return application;
  }

  /**
   * Candidate views only their own applications
   */
  static async getMyApplications(candidateUserId: string) {
    const applications = await prisma.application.findMany({
      where: { candidateId: candidateUserId },
      include: {
        job: {
          include: {
            organization: {
              select: { id: true, name: true, logoUrl: true, location: true },
            },
          },
        },
        interviews: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications.map((a) => ({
      id: a.id,
      jobId: a.jobId,
      jobTitle: a.job.title,
      jobLocation: a.job.location,
      jobType: a.job.jobType,
      organizationName: a.job.organization?.name,
      organizationLogo: a.job.organization?.logoUrl,
      status: a.status,
      resumeUrl: a.resumeUrl,
      coverLetter: a.coverLetter,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      interviews: a.interviews.map((i) => ({
        id: i.id,
        scheduledAt: i.scheduledAt.toISOString(),
        durationMinutes: i.durationMinutes,
        meetingUrl: i.meetingUrl,
        status: i.status,
      })),
    }));
  }

  /**
   * Save a job for later
   */
  static async toggleSaveJob(candidateUserId: string, jobId: string) {
    const existing = await prisma.candidateSavedJob.findUnique({
      where: {
        candidateId_jobId: { candidateId: candidateUserId, jobId },
      },
    });

    if (existing) {
      await prisma.candidateSavedJob.delete({
        where: { id: existing.id },
      });
      return { saved: false };
    } else {
      await prisma.candidateSavedJob.create({
        data: {
          candidateId: candidateUserId,
          jobId,
        },
      });
      return { saved: true };
    }
  }

  /**
   * Get candidate saved jobs
   */
  static async getSavedJobs(candidateUserId: string) {
    const saved = await prisma.candidateSavedJob.findMany({
      where: { candidateId: candidateUserId },
      include: {
        job: {
          include: {
            organization: {
              select: { id: true, name: true, logoUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return saved.map((s) => ({
      id: s.id,
      jobId: s.job.id,
      title: s.job.title,
      location: s.job.location,
      jobType: s.job.jobType,
      salaryMin: s.job.salaryMin,
      salaryMax: s.job.salaryMax,
      organizationName: s.job.organization?.name,
      organizationLogo: s.job.organization?.logoUrl,
      status: s.job.status,
      savedAt: s.createdAt.toISOString(),
    }));
  }

  /**
   * Get candidate's scheduled interviews
   */
  static async getMyInterviews(candidateUserId: string) {
    const interviews = await prisma.interview.findMany({
      where: { candidateId: candidateUserId },
      include: {
        application: {
          include: {
            job: {
              include: {
                organization: { select: { id: true, name: true, logoUrl: true } },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return interviews.map((i) => ({
      id: i.id,
      jobTitle: i.application.job.title,
      companyName: i.application.job.organization.name,
      companyLogo: i.application.job.organization.logoUrl,
      scheduledAt: i.scheduledAt.toISOString(),
      durationMinutes: i.durationMinutes,
      meetingUrl: i.meetingUrl,
      status: i.status,
    }));
  }
}
