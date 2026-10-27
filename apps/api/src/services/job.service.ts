import { prisma } from '../config/prisma.js';

export interface JobFilterParams {
  keyword?: string;
  search?: string;
  location?: string;
  type?: string;
  workplaceType?: string;
  minSalary?: number;
  status?: string;
  organizationId?: string;
  page?: number;
  limit?: number;
}

export interface CreateJobInput {
  title: string;
  description: string;
  requirements?: string[];
  department?: string;
  location?: string;
  jobType?: string;
  workplaceType?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  status?: string;
}

export class JobService {
  /**
   * List jobs with rich filters (public / candidate / recruiter view)
   */
  static async listJobs(filters: JobFilterParams) {
    const {
      keyword,
      search,
      location,
      type,
      workplaceType,
      minSalary,
      status,
      organizationId,
      page = 1,
      limit = 20,
    } = filters;

    const searchTerm = search || keyword;
    const where: any = {};

    // Organization filter
    if (organizationId) {
      where.organizationId = organizationId;
    }

    // Status filter: defaults to active/PUBLISHED if public search
    if (status) {
      if (status.toUpperCase() === 'ACTIVE') {
        where.status = { in: ['ACTIVE', 'PUBLISHED', 'active'] };
      } else {
        where.status = { equals: status, mode: 'insensitive' };
      }
    } else if (!organizationId) {
      where.status = { in: ['ACTIVE', 'PUBLISHED', 'active'] };
    }

    // Keyword search across title, description, requirements, department
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { department: { contains: searchTerm, mode: 'insensitive' } },
        { requirements: { hasSome: [searchTerm] } },
      ];
    }

    // Location filter
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Job type (FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP)
    if (type) {
      where.jobType = { equals: type, mode: 'insensitive' };
    }

    // Workplace type (remote, hybrid, onsite)
    if (workplaceType) {
      where.workplaceType = { equals: workplaceType, mode: 'insensitive' };
    }

    // Salary filter
    if (minSalary && !isNaN(Number(minSalary))) {
      where.OR = [
        { salaryMax: { gte: Number(minSalary) } },
        { salaryMin: { gte: Number(minSalary) } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              location: true,
              industry: true,
              website: true,
            },
          },
          _count: {
            select: { applications: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      jobs: jobs.map((job) => ({
        ...job,
        applicationsCount: job._count.applications,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single job by ID (public)
   */
  static async getJobById(id: string) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            location: true,
            industry: true,
            size: true,
            description: true,
            website: true,
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      return null;
    }

    return {
      ...job,
      applicationsCount: job._count.applications,
    };
  }

  /**
   * Create a job listing for an organization
   */
  static async createJob(organizationId: string, userId: string, data: CreateJobInput) {
    const normalizedStatus = data.status?.toUpperCase() === 'DRAFT' ? 'DRAFT' : 'ACTIVE';

    const job = await prisma.job.create({
      data: {
        organizationId,
        createdById: userId,
        title: data.title,
        description: data.description,
        requirements: data.requirements || [],
        department: data.department || null,
        location: data.location || null,
        jobType: data.jobType || 'FULL_TIME',
        workplaceType: data.workplaceType || 'remote',
        salaryMin: data.salaryMin ? Number(data.salaryMin) : null,
        salaryMax: data.salaryMax ? Number(data.salaryMax) : null,
        currency: data.currency || 'USD',
        status: normalizedStatus,
      },
      include: {
        organization: true,
      },
    });

    return job;
  }

  /**
   * Edit a job listing (must belong to organization)
   */
  static async updateJob(organizationId: string, jobId: string, data: Partial<CreateJobInput>) {
    const existing = await prisma.job.findFirst({
      where: { id: jobId, organizationId },
    });

    if (!existing) {
      throw new Error('Job not found or access denied for this organization');
    }

    let normalizedStatus = existing.status;
    if (data.status) {
      normalizedStatus =
        data.status.toUpperCase() === 'DRAFT'
          ? 'DRAFT'
          : data.status.toUpperCase() === 'ARCHIVED'
          ? 'ARCHIVED'
          : 'ACTIVE';
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        title: data.title !== undefined ? data.title : existing.title,
        description: data.description !== undefined ? data.description : existing.description,
        requirements: data.requirements !== undefined ? data.requirements : existing.requirements,
        department: data.department !== undefined ? data.department : existing.department,
        location: data.location !== undefined ? data.location : existing.location,
        jobType: data.jobType !== undefined ? data.jobType : existing.jobType,
        workplaceType: data.workplaceType !== undefined ? data.workplaceType : existing.workplaceType,
        salaryMin: data.salaryMin !== undefined ? (data.salaryMin ? Number(data.salaryMin) : null) : existing.salaryMin,
        salaryMax: data.salaryMax !== undefined ? (data.salaryMax ? Number(data.salaryMax) : null) : existing.salaryMax,
        currency: data.currency !== undefined ? data.currency : existing.currency,
        status: normalizedStatus,
      },
      include: {
        organization: true,
      },
    });

    return updated;
  }

  /**
   * Soft-delete job (status: archived)
   */
  static async archiveJob(organizationId: string, jobId: string) {
    const existing = await prisma.job.findFirst({
      where: { id: jobId, organizationId },
    });

    if (!existing) {
      throw new Error('Job not found or access denied for this organization');
    }

    const archived = await prisma.job.update({
      where: { id: jobId },
      data: { status: 'ARCHIVED' },
    });

    return archived;
  }
}
