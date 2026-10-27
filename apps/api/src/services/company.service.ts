import { prisma } from '../config/prisma.js';
import { Role } from '@prisma/client';
import { AuditService } from './audit.service.js';
import { hashPassword } from '../utils/password.util.js';
import crypto from 'crypto';
import { StorageService } from './storage.service.js';
import {
  CreateJobDto,
  CreateCampaignDto,
  RecruiterStatsDto,
  HiringManagerStatsDto,
  AdsManagerStatsDto,
} from '@antigravite/types';

export class CompanyService {
  // ==========================================
  // RECRUITER OPERATIONS (Organization Scoped)
  // ==========================================

  static async getJobs(organizationId: string) {
    const jobs = await prisma.job.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((j) => ({
      id: j.id,
      organizationId: j.organizationId,
      createdById: j.createdById,
      assignedHiringManagerId: j.assignedHiringManagerId,
      title: j.title,
      description: j.description,
      requirements: j.requirements,
      department: j.department,
      location: j.location,
      jobType: j.jobType,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      currency: j.currency,
      status: j.status as any,
      isPromoted: j.isPromoted,
      applicationsCount: j._count.applications,
      createdAt: j.createdAt.toISOString(),
      updatedAt: j.updatedAt.toISOString(),
    }));
  }

  static async createJob(organizationId: string, userId: string, data: CreateJobDto) {
    const job = await prisma.job.create({
      data: {
        organizationId,
        createdById: userId,
        assignedHiringManagerId: data.assignedHiringManagerId || null,
        title: data.title,
        description: data.description,
        requirements: data.requirements || [],
        department: data.department,
        location: data.location,
        jobType: data.jobType || 'FULL_TIME',
        salaryMin: data.salaryMin ? Number(data.salaryMin) : null,
        salaryMax: data.salaryMax ? Number(data.salaryMax) : null,
        currency: data.currency || 'USD',
        status: 'PUBLISHED',
      },
    });

    await AuditService.log({
      userId,
      action: 'RECRUITER_JOB_CREATED',
      resource: 'JOB',
      resourceId: job.id,
      details: { organizationId, title: job.title },
    });

    return job;
  }

  static async updateJob(organizationId: string, jobId: string, data: Partial<CreateJobDto> & { status?: string }) {
    // Multi-tenant check: ensure job belongs to this company
    const existing = await prisma.job.findFirst({
      where: { id: jobId, organizationId },
    });

    if (!existing) {
      throw new Error('Job posting not found in this company.');
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        department: data.department,
        location: data.location,
        jobType: data.jobType,
        salaryMin: data.salaryMin !== undefined ? Number(data.salaryMin) : undefined,
        salaryMax: data.salaryMax !== undefined ? Number(data.salaryMax) : undefined,
        status: data.status,
        assignedHiringManagerId: data.assignedHiringManagerId,
      },
    });

    return updated;
  }

  static async getApplications(organizationId: string, jobId?: string, status?: string) {
    const where: any = {
      job: { organizationId },
    };

    if (jobId) where.jobId = jobId;
    if (status) where.status = status;

    const applications = await prisma.application.findMany({
      where,
      include: {
        job: { select: { id: true, title: true, department: true } },
        candidate: {
          select: {
            id: true,
            email: true,
            candidateProfile: true,
          },
        },
        interviews: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications.map((a) => ({
      id: a.id,
      jobId: a.jobId,
      jobTitle: a.job.title,
      jobDepartment: a.job.department,
      organizationId,
      candidateId: a.candidateId,
      candidateName: a.candidate.candidateProfile?.fullName || 'Candidate',
      candidateEmail: a.candidate.email,
      candidateHeadline: a.candidate.candidateProfile?.headline,
      candidateSkills: a.candidate.candidateProfile?.skills || [],
      candidateAvatarUrl: a.candidate.candidateProfile?.avatarUrl,
      status: a.status as any,
      resumeUrl: a.resumeUrl || a.candidate.candidateProfile?.resumeUrl,
      coverLetter: a.coverLetter,
      stageNotes: a.stageNotes,
      feedback: a.feedback,
      rating: a.rating,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
  }

  static async updateApplicationStage(
    organizationId: string,
    applicationId: string,
    status: string,
    stageNotes?: string,
    recruiterUserId?: string
  ) {
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { organizationId },
      },
      include: { job: true },
    });

    if (!application) {
      throw new Error('Application not found for your organization.');
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        stageNotes: stageNotes || application.stageNotes,
      },
    });

    await AuditService.log({
      userId: recruiterUserId,
      action: 'RECRUITER_APPLICATION_STAGE_UPDATED',
      resource: 'APPLICATION',
      resourceId: applicationId,
      details: { organizationId, newStatus: status },
    });

    return updated;
  }

  static async scheduleInterview(
    organizationId: string,
    data: {
      applicationId: string;
      interviewerId: string;
      scheduledAt: string;
      durationMinutes?: number;
      meetingUrl?: string;
    },
    recruiterUserId?: string
  ) {
    const application = await prisma.application.findFirst({
      where: {
        id: data.applicationId,
        job: { organizationId },
      },
    });

    if (!application) {
      throw new Error('Application not found in your organization.');
    }

    const interview = await prisma.interview.create({
      data: {
        applicationId: data.applicationId,
        candidateId: application.candidateId,
        interviewerId: data.interviewerId,
        scheduledAt: new Date(data.scheduledAt),
        durationMinutes: data.durationMinutes || 45,
        meetingUrl: data.meetingUrl || `https://meet.jobmatch.io/room-${Date.now()}`,
        status: 'SCHEDULED',
      },
    });

    // Update application stage to INTERVIEW_SCHEDULED
    await prisma.application.update({
      where: { id: data.applicationId },
      data: { status: 'INTERVIEW_SCHEDULED' },
    });

    await AuditService.log({
      userId: recruiterUserId,
      action: 'INTERVIEW_SCHEDULED',
      resource: 'INTERVIEW',
      resourceId: interview.id,
      details: { organizationId, scheduledAt: data.scheduledAt },
    });

    return interview;
  }

  static async getRecruiterStats(organizationId: string): Promise<RecruiterStatsDto> {
    const [
      activeJobsCount,
      totalApplicationsCount,
      shortlistedCount,
      interviewsScheduledCount,
      offersMadeCount,
    ] = await Promise.all([
      prisma.job.count({ where: { organizationId, status: 'PUBLISHED' } }),
      prisma.application.count({ where: { job: { organizationId } } }),
      prisma.application.count({ where: { job: { organizationId }, status: 'SHORTLISTED' } }),
      prisma.application.count({ where: { job: { organizationId }, status: 'INTERVIEW_SCHEDULED' } }),
      prisma.application.count({ where: { job: { organizationId }, status: { in: ['OFFERED', 'HIRED'] } } }),
    ]);

    return {
      activeJobsCount,
      totalApplicationsCount,
      shortlistedCount,
      interviewsScheduledCount,
      offersMadeCount,
    };
  }

  // ==========================================
  // HIRING MANAGER OPERATIONS (Organization & Assigned Jobs Scoped)
  // ==========================================

  static async getAssignedJobs(organizationId: string, hiringManagerUserId: string) {
    const jobs = await prisma.job.findMany({
      where: {
        organizationId,
        assignedHiringManagerId: hiringManagerUserId,
      },
      include: {
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((j) => ({
      id: j.id,
      title: j.title,
      department: j.department,
      location: j.location,
      status: j.status,
      applicationsCount: j._count.applications,
      createdAt: j.createdAt.toISOString(),
    }));
  }

  static async getShortlistedCandidates(organizationId: string, hiringManagerUserId?: string) {
    const where: any = {
      job: { organizationId },
      status: { in: ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'HIRED', 'REJECTED'] },
    };

    if (hiringManagerUserId) {
      where.job.assignedHiringManagerId = hiringManagerUserId;
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        job: { select: { id: true, title: true, department: true } },
        candidate: {
          select: {
            id: true,
            email: true,
            candidateProfile: true,
          },
        },
        interviews: {
          orderBy: { scheduledAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return applications.map((a) => ({
      id: a.id,
      jobId: a.jobId,
      jobTitle: a.job.title,
      candidateId: a.candidateId,
      candidateName: a.candidate.candidateProfile?.fullName || 'Candidate',
      candidateEmail: a.candidate.email,
      candidateHeadline: a.candidate.candidateProfile?.headline,
      candidateSkills: a.candidate.candidateProfile?.skills || [],
      candidateAvatarUrl: a.candidate.candidateProfile?.avatarUrl,
      status: a.status,
      resumeUrl: a.resumeUrl || a.candidate.candidateProfile?.resumeUrl,
      coverLetter: a.coverLetter,
      feedback: a.feedback,
      rating: a.rating,
      stageNotes: a.stageNotes,
      interviews: a.interviews.map((i) => ({
        id: i.id,
        scheduledAt: i.scheduledAt.toISOString(),
        status: i.status,
        meetingUrl: i.meetingUrl,
        feedback: i.feedback,
        rating: i.rating,
        recommendation: i.recommendation,
      })),
      updatedAt: a.updatedAt.toISOString(),
    }));
  }

  static async submitInterviewEvaluation(
    organizationId: string,
    applicationId: string,
    hiringManagerUserId: string,
    feedback: string,
    rating: number,
    recommendation: string
  ) {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, job: { organizationId } },
    });

    if (!application) {
      throw new Error('Application not found in your organization.');
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        feedback,
        rating,
        stageNotes: `Evaluation: ${recommendation}. ${feedback}`,
      },
    });

    await AuditService.log({
      userId: hiringManagerUserId,
      action: 'HIRING_MANAGER_FEEDBACK_SUBMITTED',
      resource: 'APPLICATION',
      resourceId: applicationId,
      details: { organizationId, rating, recommendation },
    });

    return updated;
  }

  static async submitHiringDecision(
    organizationId: string,
    applicationId: string,
    decision: 'OFFERED' | 'REJECTED',
    hiringManagerUserId: string
  ) {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, job: { organizationId } },
    });

    if (!application) {
      throw new Error('Application not found in your organization.');
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status: decision },
    });

    await AuditService.log({
      userId: hiringManagerUserId,
      action: `HIRING_DECISION_${decision}`,
      resource: 'APPLICATION',
      resourceId: applicationId,
      details: { organizationId, decision },
    });

    return updated;
  }

  static async getHiringManagerStats(organizationId: string, hiringManagerUserId?: string): Promise<HiringManagerStatsDto> {
    const jobWhere: any = { organizationId };
    const appWhere: any = { job: { organizationId } };

    if (hiringManagerUserId) {
      jobWhere.assignedHiringManagerId = hiringManagerUserId;
      appWhere.job.assignedHiringManagerId = hiringManagerUserId;
    }

    const [assignedJobsCount, shortlistedCandidatesCount, pendingFeedbackCount, approvedCandidatesCount] =
      await Promise.all([
        prisma.job.count({ where: jobWhere }),
        prisma.application.count({
          where: { ...appWhere, status: { in: ['SHORTLISTED', 'INTERVIEW_SCHEDULED'] } },
        }),
        prisma.application.count({
          where: { ...appWhere, status: 'INTERVIEW_SCHEDULED', feedback: null },
        }),
        prisma.application.count({
          where: { ...appWhere, status: { in: ['OFFERED', 'HIRED'] } },
        }),
      ]);

    return {
      assignedJobsCount,
      shortlistedCandidatesCount,
      pendingFeedbackCount,
      approvedCandidatesCount,
    };
  }

  // ==========================================
  // ADS MANAGER OPERATIONS (Organization Scoped)
  // ==========================================

  static async getCampaigns(organizationId: string) {
    const campaigns = await prisma.advertisingCampaign.findMany({
      where: { organizationId },
      include: {
        job: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map((c) => ({
      id: c.id,
      organizationId: c.organizationId,
      createdById: c.createdById,
      jobId: c.jobId,
      jobTitle: c.job?.title,
      name: c.name,
      budget: c.budget,
      spent: c.spent,
      dailyBudget: c.dailyBudget,
      status: c.status as any,
      impressions: c.impressions,
      clicks: c.clicks,
      conversions: c.conversions,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate?.toISOString() || null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  static async createCampaign(organizationId: string, userId: string, data: CreateCampaignDto) {
    const campaign = await prisma.advertisingCampaign.create({
      data: {
        organizationId,
        createdById: userId,
        jobId: data.jobId || null,
        name: data.name,
        budget: Number(data.budget),
        dailyBudget: Number(data.dailyBudget),
        spent: 0,
        status: 'ACTIVE',
        impressions: 0,
        clicks: 0,
        conversions: 0,
      },
    });

    // Mark job as promoted if attached
    if (data.jobId) {
      await prisma.job.update({
        where: { id: data.jobId },
        data: { isPromoted: true },
      });
    }

    await AuditService.log({
      userId,
      action: 'ADS_CAMPAIGN_CREATED',
      resource: 'CAMPAIGN',
      resourceId: campaign.id,
      details: { organizationId, name: campaign.name, budget: campaign.budget },
    });

    return campaign;
  }

  static async updateCampaignStatus(organizationId: string, campaignId: string, status: string, userId?: string) {
    const existing = await prisma.advertisingCampaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!existing) {
      throw new Error('Campaign not found in your organization.');
    }

    const updated = await prisma.advertisingCampaign.update({
      where: { id: campaignId },
      data: { status },
    });

    await AuditService.log({
      userId,
      action: 'ADS_CAMPAIGN_STATUS_UPDATED',
      resource: 'CAMPAIGN',
      resourceId: campaignId,
      details: { organizationId, newStatus: status },
    });

    return updated;
  }

  static async getAdsAnalytics(organizationId: string): Promise<AdsManagerStatsDto> {
    const campaigns = await prisma.advertisingCampaign.findMany({
      where: { organizationId },
    });

    let totalBudget = 0;
    let totalSpent = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let activeCampaigns = 0;

    for (const c of campaigns) {
      totalBudget += c.budget;
      totalSpent += c.spent;
      totalImpressions += c.impressions;
      totalClicks += c.clicks;
      totalConversions += c.conversions;
      if (c.status === 'ACTIVE') activeCampaigns++;
    }

    const avgCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns,
      totalBudget,
      totalSpent,
      totalImpressions,
      totalClicks,
      totalConversions,
      avgCtr,
    };
  }

  // ==========================================
  // COMPANY TEAM & INVITATION MANAGEMENT
  // ==========================================

  static async getMembers(organizationId: string) {
    const members = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return members.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  static async inviteMember(
    organizationId: string,
    email: string,
    role: Role,
    inviterUserId?: string
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    // Prevent inviting Platform Administrators
    if (role === Role.PLATFORM_ADMIN || role === Role.ADMIN_MANAGER) {
      throw new Error('Cannot invite platform administrators into a company organization.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day invitation validity

    const invitation = await prisma.companyInvitation.create({
      data: {
        organizationId,
        email: normalizedEmail,
        role,
        token,
        expiresAt,
        status: 'PENDING',
      },
    });

    await AuditService.log({
      userId: inviterUserId,
      action: 'COMPANY_MEMBER_INVITED',
      resource: 'COMPANY_INVITATION',
      resourceId: invitation.id,
      details: { organizationId, invitedEmail: normalizedEmail, role },
    });

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
      inviteLink: `http://localhost:5173/accept-invite?token=${token}`,
    };
  }

  static async removeMember(organizationId: string, memberUserId: string, removerUserId?: string) {
    const member = await prisma.user.findFirst({
      where: { id: memberUserId, organizationId },
    });

    if (!member) {
      throw new Error('Team member not found in your organization.');
    }

    if (member.role === Role.COMPANY_OWNER) {
      throw new Error('Cannot remove the primary company owner.');
    }

    const updated = await prisma.user.update({
      where: { id: memberUserId },
      data: {
        organizationId: null,
        role: Role.CANDIDATE, // Revert to regular account
      },
    });

    await AuditService.log({
      userId: removerUserId,
      action: 'COMPANY_MEMBER_REMOVED',
      resource: 'USER',
      resourceId: memberUserId,
      details: { organizationId, removedEmail: member.email },
    });

    return updated;
  }

  // ==========================================
  // COMPANY PROFILE OPERATIONS
  // ==========================================

  static async getCompanyProfile(organizationId: string) {
    const company = await prisma.company.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: { jobs: true, employees: true },
        },
      },
    });

    if (!company) {
      throw new Error('Organization not found');
    }

    return company;
  }

  static async updateCompanyProfile(
    organizationId: string,
    data: {
      name?: string;
      website?: string;
      industry?: string;
      size?: string;
      description?: string;
      location?: string;
      logoUrl?: string;
    },
    logoFile?: { buffer: Buffer; originalname: string; mimetype: string }
  ) {
    let logoUrl = data.logoUrl;
    if (logoFile) {
      const upload = await StorageService.uploadFile(
        logoFile.buffer,
        logoFile.originalname,
        logoFile.mimetype,
        'logos'
      );
      logoUrl = upload.fileUrl;
    }

    const updated = await prisma.company.update({
      where: { id: organizationId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        website: data.website !== undefined ? data.website : undefined,
        industry: data.industry !== undefined ? data.industry : undefined,
        size: data.size !== undefined ? data.size : undefined,
        description: data.description !== undefined ? data.description : undefined,
        location: data.location !== undefined ? data.location : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
      },
    });

    return updated;
  }
}
