import { z } from 'zod';

export const jobTypePreferenceEnum = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
  'REMOTE',
]);

export const companySizeEnum = z.enum([
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '500+',
]);

export const createCandidateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  headline: z.string().max(120, 'Headline must not exceed 120 characters').optional().nullable(),
  bio: z.string().max(2000, 'Bio must not exceed 2000 characters').optional().nullable(),
  skills: z.array(z.string()).default([]),
  location: z.string().optional().nullable(),
  expectedSalaryMin: z.number().nonnegative().optional().nullable(),
  expectedSalaryMax: z.number().nonnegative().optional().nullable(),
  salaryCurrency: z.string().default('USD').optional().nullable(),
  jobTypePreference: jobTypePreferenceEnum.optional().nullable(),
  avatarUrl: z.string().url().optional().nullable().or(z.literal('')),
  resumeUrl: z.string().url().optional().nullable().or(z.literal('')),
});

export const updateCandidateProfileSchema = createCandidateProfileSchema.partial();

export const createCompanyProfileSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  website: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  size: companySizeEnum.optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal('')),
  location: z.string().optional().nullable(),
});

export const updateCompanyProfileSchema = createCompanyProfileSchema.partial();

export type CreateCandidateProfileInput = z.infer<typeof createCandidateProfileSchema>;
export type UpdateCandidateProfileInput = z.infer<typeof updateCandidateProfileSchema>;
export type CreateCompanyProfileInput = z.infer<typeof createCompanyProfileSchema>;
export type UpdateCompanyProfileInput = z.infer<typeof updateCompanyProfileSchema>;
