import { prisma } from '../config/prisma.js';
import { Role } from '@prisma/client';
import { hashPassword } from '../utils/password.util.js';
import { AuditService } from './audit.service.js';
import { AdminStatsDto, CompanyDto, UserDto, JobDto, AdvertisingCampaignDto } from '@antigravite/types';

export class AdminService {
  /**
   * System-wide overview and KPI statistics
   */
  static async getOverviewStats(): Promise<AdminStatsDto> {
    const [
      totalUsers,
      totalCandidates,
      totalCompanies,
      totalRecruiters,
      totalHiringManagers,
      totalAdsManagers,
      totalAdmins,
      totalJobs,
      activeJobs,
      totalApplications,
      totalCampaigns,
      campaignsAggregate,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.CANDIDATE } }),
      prisma.company.count(),
      prisma.user.count({ where: { role: Role.RECRUITER } }),
      prisma.user.count({ where: { role: Role.HIRING_MANAGER } }),
      prisma.user.count({ where: { role: Role.ADS_MANAGER } }),
      prisma.user.count({
        where: {
          role: { in: [Role.PLATFORM_ADMIN, Role.ADMIN_MANAGER] },
        },
      }),
      prisma.job.count(),
      prisma.job.count({ where: { status: 'PUBLISHED' } }),
      prisma.application.count(),
      prisma.advertisingCampaign.count(),
      prisma.advertisingCampaign.aggregate({
        _sum: { spent: true },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      totalUsers,
      totalCandidates,
      totalCompanies,
      totalRecruiters,
      totalHiringManagers,
      totalAdsManagers,
      totalAdmins,
      totalJobs,
      activeJobs,
      totalApplications,
      totalCampaigns,
      totalAdSpend: campaignsAggregate._sum.spent || 0,
      recentAuditLogs: recentAuditLogs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
    };
  }

  /**
   * List all companies with pagination, filtering, and team member counts
   */
  static async getCompanies(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, query.limit || 20);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { industry: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          _count: {
            select: {
              employees: true,
              jobs: true,
              campaigns: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    return {
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        website: c.website,
        industry: c.industry,
        size: c.size,
        description: c.description,
        logoUrl: c.logoUrl,
        location: c.location,
        status: c.status as any,
        ownerId: c.ownerId,
        employeeCount: c._count.employees,
        activeJobsCount: c._count.jobs,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Create a new company organization administratively
   */
  static async createCompany(data: {
    name: string;
    industry?: string;
    website?: string;
    location?: string;
    size?: string;
    description?: string;
  }, adminUserId?: string) {
    const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const company = await prisma.company.create({
      data: {
        name: data.name,
        slug,
        industry: data.industry,
        website: data.website,
        location: data.location,
        size: data.size,
        description: data.description,
        status: 'ACTIVE',
      },
    });

    await AuditService.log({
      userId: adminUserId,
      action: 'ADMIN_CREATE_COMPANY',
      resource: 'COMPANY',
      resourceId: company.id,
      details: { name: company.name },
    });

    return company;
  }

  /**
   * Suspend or Reactivate a Company
   */
  static async updateCompanyStatus(companyId: string, status: 'ACTIVE' | 'SUSPENDED', adminUserId?: string) {
    const company = await prisma.company.update({
      where: { id: companyId },
      data: { status },
    });

    await AuditService.log({
      userId: adminUserId,
      action: status === 'ACTIVE' ? 'ADMIN_COMPANY_REACTIVATED' : 'ADMIN_COMPANY_SUSPENDED',
      resource: 'COMPANY',
      resourceId: company.id,
      details: { status },
    });

    return company;
  }

  /**
   * List candidate accounts
   */
  static async getCandidates(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, query.limit || 20);
    const skip = (page - 1) * limit;

    const where: any = { role: Role.CANDIDATE };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { candidateProfile: { fullName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          candidateProfile: true,
          _count: {
            select: { applications: true, savedJobs: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      candidates: users.map((u) => ({
        id: u.id,
        email: u.email,
        status: u.status,
        isEmailVerified: u.isEmailVerified,
        fullName: u.candidateProfile?.fullName || 'Anonymous',
        headline: u.candidateProfile?.headline,
        location: u.candidateProfile?.location,
        skills: u.candidateProfile?.skills || [],
        applicationsCount: u._count.applications,
        savedJobsCount: u._count.savedJobs,
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * List company users (Recruiters, Hiring Managers, Ads Managers)
   */
  static async getCompanyUsers(query: {
    organizationId?: string;
    role?: Role;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, query.limit || 30);
    const skip = (page - 1) * limit;

    const where: any = {
      role: query.role ? query.role : { in: [Role.COMPANY_OWNER, Role.RECRUITER, Role.HIRING_MANAGER, Role.ADS_MANAGER] },
    };

    if (query.organizationId) where.organizationId = query.organizationId;
    if (query.search) {
      where.email = { contains: query.search, mode: 'insensitive' };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        status: u.status,
        organizationId: u.organizationId,
        organizationName: u.organization?.name,
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Update user status (ACTIVE, SUSPENDED, DEACTIVATED)
   */
  static async updateUserStatus(userId: string, status: string, adminUserId?: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    await AuditService.log({
      userId: adminUserId,
      action: 'ADMIN_UPDATE_USER_STATUS',
      resource: 'USER',
      resourceId: user.id,
      details: { email: user.email, newStatus: status },
    });

    return user;
  }

  /**
   * Update user role or organization assignment
   */
  static async updateUserRoleAndOrg(userId: string, data: { role?: Role; organizationId?: string | null }, adminUserId?: string) {
    const updateData: any = {};
    if (data.role) updateData.role = data.role;
    if (data.organizationId !== undefined) updateData.organizationId = data.organizationId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await AuditService.log({
      userId: adminUserId,
      action: 'ADMIN_UPDATE_USER_ROLE_ORG',
      resource: 'USER',
      resourceId: user.id,
      details: { email: user.email, updateData },
    });

    return user;
  }

  /**
   * List platform administrator accounts and admin managers
   */
  static async getAdminAccounts() {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: [Role.PLATFORM_ADMIN, Role.ADMIN_MANAGER] },
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        adminPermissions: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return admins.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
  }

  /**
   * Securely provision an Admin Manager with assigned permissions
   */
  static async createAdminManager(
    data: {
      email: string;
      passwordPlain: string;
      permissions: string[];
    },
    superAdminId?: string
  ) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const passwordHash = await hashPassword(data.passwordPlain);

    const admin = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: Role.ADMIN_MANAGER,
        status: 'ACTIVE',
        isEmailVerified: true,
        adminPermissions: data.permissions || [],
      },
    });

    await AuditService.log({
      userId: superAdminId,
      action: 'ADMIN_CREATE_ADMIN_MANAGER',
      resource: 'ADMIN',
      resourceId: admin.id,
      details: {
        email: admin.email,
        permissions: data.permissions,
      },
    });

    return {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      status: admin.status,
      adminPermissions: admin.adminPermissions,
      createdAt: admin.createdAt.toISOString(),
    };
  }

  /**
   * Update permissions of an Admin Manager
   */
  static async updateAdminManagerPermissions(
    adminManagerId: string,
    permissions: string[],
    superAdminId?: string
  ) {
    const target = await prisma.user.findUnique({
      where: { id: adminManagerId },
    });

    if (!target) {
      throw new Error('Admin account not found.');
    }

    if (target.role === Role.PLATFORM_ADMIN) {
      throw new Error('Cannot restrict permissions of a primary Platform Administrator.');
    }

    const updated = await prisma.user.update({
      where: { id: adminManagerId },
      data: { adminPermissions: permissions },
    });

    await AuditService.log({
      userId: superAdminId,
      action: 'ADMIN_UPDATE_ADMIN_MANAGER_PERMISSIONS',
      resource: 'ADMIN',
      resourceId: target.id,
      details: {
        email: target.email,
        newPermissions: permissions,
      },
    });

    return updated;
  }

  /**
   * Platform-wide jobs moderation
   */
  static async getPlatformJobs(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, query.limit || 20);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { organization: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          organization: { select: { id: true, name: true, logoUrl: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
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
        createdById: j.createdById,
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
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Update Job Status (PUBLISHED, CLOSED, ARCHIVED)
   */
  static async updateJobStatus(jobId: string, status: string, adminUserId?: string) {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { status },
    });

    await AuditService.log({
      userId: adminUserId,
      action: 'ADMIN_UPDATE_JOB_STATUS',
      resource: 'JOB',
      resourceId: jobId,
      details: { title: job.title, newStatus: status },
    });

    return job;
  }

  /**
   * Platform-wide advertising campaigns
   */
  static async getPlatformCampaigns(query: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, query.limit || 20);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;

    const [campaigns, total] = await Promise.all([
      prisma.advertisingCampaign.findMany({
        where,
        include: {
          organization: { select: { id: true, name: true } },
          job: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.advertisingCampaign.count({ where }),
    ]);

    return {
      campaigns: campaigns.map((c) => ({
        id: c.id,
        organizationId: c.organizationId,
        organizationName: c.organization?.name,
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
      })),
      total,
      page,
      limit,
    };
  }
}
