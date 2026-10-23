import { prisma } from '../config/prisma.js';
import {
  CreateCandidateProfileInput,
  UpdateCandidateProfileInput,
  CreateCompanyProfileInput,
  UpdateCompanyProfileInput,
} from '../schemas/profile.schema.js';
import { CandidateProfile, CompanyProfile } from '@antigravite/types';

export class ProfileService {
  /**
   * Create candidate profile for logged-in candidate
   */
  static async createCandidateProfile(
    userId: string,
    data: CreateCandidateProfileInput
  ): Promise<CandidateProfile> {
    const existing = await prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new Error('Candidate profile already exists for this user. Use PUT to update.');
    }

    const profile = await prisma.candidateProfile.create({
      data: {
        userId,
        fullName: data.fullName,
        headline: data.headline,
        bio: data.bio,
        skills: data.skills || [],
        location: data.location,
        expectedSalaryMin: data.expectedSalaryMin,
        expectedSalaryMax: data.expectedSalaryMax,
        salaryCurrency: data.salaryCurrency || 'USD',
        jobTypePreference: data.jobTypePreference,
        avatarUrl: data.avatarUrl,
        resumeUrl: data.resumeUrl,
      },
    });

    return this.mapCandidateProfile(profile);
  }

  /**
   * Update candidate profile
   */
  static async updateCandidateProfile(
    userId: string,
    data: UpdateCandidateProfileInput
  ): Promise<CandidateProfile> {
    const existing = await prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (!existing) {
      // Upsert if not created yet
      if (!data.fullName) {
        throw new Error('Candidate profile not found. Please provide a full name to create one.');
      }
      return this.createCandidateProfile(userId, data as CreateCandidateProfileInput);
    }

    const profile = await prisma.candidateProfile.update({
      where: { userId },
      data: {
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.headline !== undefined ? { headline: data.headline } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.skills !== undefined ? { skills: data.skills } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.expectedSalaryMin !== undefined ? { expectedSalaryMin: data.expectedSalaryMin } : {}),
        ...(data.expectedSalaryMax !== undefined ? { expectedSalaryMax: data.expectedSalaryMax } : {}),
        ...(data.salaryCurrency !== undefined ? { salaryCurrency: data.salaryCurrency } : {}),
        ...(data.jobTypePreference !== undefined ? { jobTypePreference: data.jobTypePreference } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.resumeUrl !== undefined ? { resumeUrl: data.resumeUrl } : {}),
      },
    });

    return this.mapCandidateProfile(profile);
  }

  /**
   * Get candidate profile by ID or userId
   */
  static async getCandidateProfile(idOrUserId: string): Promise<CandidateProfile> {
    const profile = await prisma.candidateProfile.findFirst({
      where: {
        OR: [{ id: idOrUserId }, { userId: idOrUserId }],
      },
    });

    if (!profile) {
      throw new Error('Candidate profile not found.');
    }

    return this.mapCandidateProfile(profile);
  }

  /**
   * Create company profile for logged-in company user
   */
  static async createCompanyProfile(
    userId: string,
    data: CreateCompanyProfileInput
  ): Promise<CompanyProfile> {
    const existing = await prisma.companyProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new Error('Company profile already exists for this user. Use PUT to update.');
    }

    const profile = await prisma.companyProfile.create({
      data: {
        userId,
        name: data.name,
        website: data.website,
        industry: data.industry,
        size: data.size,
        description: data.description,
        logoUrl: data.logoUrl,
        location: data.location,
      },
    });

    return this.mapCompanyProfile(profile);
  }

  /**
   * Update company profile
   */
  static async updateCompanyProfile(
    userId: string,
    data: UpdateCompanyProfileInput
  ): Promise<CompanyProfile> {
    const existing = await prisma.companyProfile.findUnique({
      where: { userId },
    });

    if (!existing) {
      if (!data.name) {
        throw new Error('Company profile not found. Please provide a name to create one.');
      }
      return this.createCompanyProfile(userId, data as CreateCompanyProfileInput);
    }

    const profile = await prisma.companyProfile.update({
      where: { userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.website !== undefined ? { website: data.website } : {}),
        ...(data.industry !== undefined ? { industry: data.industry } : {}),
        ...(data.size !== undefined ? { size: data.size } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
      },
    });

    return this.mapCompanyProfile(profile);
  }

  /**
   * Get company profile by ID or userId
   */
  static async getCompanyProfile(idOrUserId: string): Promise<CompanyProfile> {
    const profile = await prisma.companyProfile.findFirst({
      where: {
        OR: [{ id: idOrUserId }, { userId: idOrUserId }],
      },
    });

    if (!profile) {
      throw new Error('Company profile not found.');
    }

    return this.mapCompanyProfile(profile);
  }

  /**
   * Get profile for logged-in user
   */
  static async getMyProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        candidateProfile: true,
        companyProfile: true,
      },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      candidateProfile: user.candidateProfile
        ? this.mapCandidateProfile(user.candidateProfile)
        : null,
      companyProfile: user.companyProfile
        ? this.mapCompanyProfile(user.companyProfile)
        : null,
    };
  }

  private static mapCandidateProfile(profile: any): CandidateProfile {
    return {
      id: profile.id,
      userId: profile.userId,
      fullName: profile.fullName,
      headline: profile.headline,
      bio: profile.bio,
      skills: profile.skills,
      location: profile.location,
      expectedSalaryMin: profile.expectedSalaryMin,
      expectedSalaryMax: profile.expectedSalaryMax,
      salaryCurrency: profile.salaryCurrency,
      jobTypePreference: profile.jobTypePreference,
      avatarUrl: profile.avatarUrl,
      resumeUrl: profile.resumeUrl,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  private static mapCompanyProfile(profile: any): CompanyProfile {
    return {
      id: profile.id,
      userId: profile.userId,
      name: profile.name,
      website: profile.website,
      industry: profile.industry,
      size: profile.size,
      description: profile.description,
      logoUrl: profile.logoUrl,
      location: profile.location,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
