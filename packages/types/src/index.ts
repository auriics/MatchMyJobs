export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  COMPANY_OWNER = 'COMPANY_OWNER',
  RECRUITER = 'RECRUITER',
  HIRING_MANAGER = 'HIRING_MANAGER',
  ADS_MANAGER = 'ADS_MANAGER',
  ADMIN_MANAGER = 'ADMIN_MANAGER',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
}

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export type AdminPermission =
  | 'MANAGE_COMPANIES'
  | 'MANAGE_CANDIDATES'
  | 'MANAGE_JOBS'
  | 'VIEW_REPORTS'
  | 'MANAGE_RECRUITMENT'
  | 'MANAGE_ADS'
  | 'MANAGE_SETTINGS';

export type JobTypePreference =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'INTERNSHIP'
  | 'REMOTE';

export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export type ApplicationStatus =
  | 'APPLIED'
  | 'SCREENING'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'OFFERED'
  | 'REJECTED'
  | 'HIRED';

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export type CompanySize =
  | '1-10'
  | '11-50'
  | '51-200'
  | '201-500'
  | '500+';

export interface UserDto {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  organizationId?: string | null;
  organizationName?: string | null;
  adminPermissions?: string[];
  mfaEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  role: UserRole;
  companyName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AdminLoginDto {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RefreshTokenDto {
  refreshToken?: string;
}

export interface OAuthLoginDto {
  provider: 'google' | 'linkedin';
  token: string;
  role?: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserDto;
  tokens: AuthTokens;
  hasProfile: boolean;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  fullName: string;
  headline?: string | null;
  bio?: string | null;
  skills: string[];
  phone?: string | null;
  location?: string | null;
  expectedSalaryMin?: number | null;
  expectedSalaryMax?: number | null;
  salaryCurrency?: string | null;
  jobTypePreference?: JobTypePreference | null;
  experience?: any;
  education?: any;
  languages?: string[];
  certifications?: string[];
  avatarUrl?: string | null;
  resumeUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidateProfileDto {
  fullName: string;
  headline?: string;
  bio?: string;
  skills: string[];
  phone?: string;
  location?: string;
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  salaryCurrency?: string;
  jobTypePreference?: JobTypePreference;
  experience?: any;
  education?: any;
  languages?: string[];
  certifications?: string[];
  avatarUrl?: string;
  resumeUrl?: string;
}

export interface UpdateCandidateProfileDto {
  fullName?: string;
  headline?: string;
  bio?: string;
  skills?: string[];
  phone?: string;
  location?: string;
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  salaryCurrency?: string;
  jobTypePreference?: JobTypePreference;
  experience?: any;
  education?: any;
  languages?: string[];
  certifications?: string[];
  avatarUrl?: string;
  resumeUrl?: string;
}

export interface CompanyProfile {
  id: string;
  userId: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  size?: CompanySize | null;
  description?: string | null;
  logoUrl?: string | null;
  location?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyProfileDto {
  name: string;
  website?: string;
  industry?: string;
  size?: CompanySize;
  description?: string;
  logoUrl?: string;
  location?: string;
}

export interface UpdateCompanyProfileDto {
  name?: string;
  website?: string;
  industry?: string;
  size?: CompanySize;
  description?: string;
  logoUrl?: string;
  location?: string;
}

export interface CompanyDto {
  id: string;
  name: string;
  slug: string;
  website?: string | null;
  industry?: string | null;
  size?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  location?: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  ownerId?: string | null;
  employeeCount?: number;
  activeJobsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyInvitationDto {
  id: string;
  organizationId: string;
  organizationName?: string;
  email: string;
  role: UserRole;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
}

export interface JobDto {
  id: string;
  organizationId: string;
  organizationName?: string;
  organizationLogo?: string | null;
  createdById: string;
  assignedHiringManagerId?: string | null;
  assignedHiringManagerName?: string | null;
  title: string;
  description: string;
  requirements: string[];
  department?: string | null;
  location?: string | null;
  jobType: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency: string;
  status: JobStatus;
  isPromoted: boolean;
  applicationsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobDto {
  title: string;
  description: string;
  requirements: string[];
  department?: string;
  location?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  assignedHiringManagerId?: string;
}

export interface ApplicationDto {
  id: string;
  jobId: string;
  jobTitle?: string;
  jobDepartment?: string | null;
  organizationId?: string;
  organizationName?: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  candidateHeadline?: string | null;
  candidateSkills?: string[];
  candidateAvatarUrl?: string | null;
  status: ApplicationStatus;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  stageNotes?: string | null;
  feedback?: string | null;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewDto {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName?: string;
  jobTitle?: string;
  interviewerId: string;
  interviewerName?: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl?: string | null;
  status: InterviewStatus;
  feedback?: string | null;
  rating?: number | null;
  recommendation?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdvertisingCampaignDto {
  id: string;
  organizationId: string;
  organizationName?: string;
  createdById: string;
  jobId?: string | null;
  jobTitle?: string | null;
  name: string;
  budget: number;
  spent: number;
  dailyBudget: number;
  status: CampaignStatus;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: string;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignDto {
  name: string;
  jobId?: string;
  budget: number;
  dailyBudget: number;
}

export interface AuditLogDto {
  id: string;
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AdminStatsDto {
  totalUsers: number;
  totalCandidates: number;
  totalCompanies: number;
  totalRecruiters: number;
  totalHiringManagers: number;
  totalAdsManagers: number;
  totalAdmins: number;
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  totalCampaigns: number;
  totalAdSpend: number;
  recentAuditLogs: AuditLogDto[];
}

export interface RecruiterStatsDto {
  activeJobsCount: number;
  totalApplicationsCount: number;
  shortlistedCount: number;
  interviewsScheduledCount: number;
  offersMadeCount: number;
}

export interface HiringManagerStatsDto {
  assignedJobsCount: number;
  shortlistedCandidatesCount: number;
  pendingFeedbackCount: number;
  approvedCandidatesCount: number;
}

export interface AdsManagerStatsDto {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  totalSpent: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCtr: number;
}

export interface AvatarUploadResponse {
  avatarUrl: string;
  key?: string;
}

export interface MeResponse {
  user: UserDto;
  candidateProfile?: CandidateProfile | null;
  companyProfile?: CompanyProfile | null;
  organization?: CompanyDto | null;
  hasProfile: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export interface ParsedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  languages: string[];
  certifications: string[];
}

export interface ResumeDto {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  parsedData?: ParsedResumeData;
  createdAt: string;
}

export interface JobMatchDto {
  id: string;
  jobId: string;
  candidateId: string;
  score: number;
  reason: string;
  matchedSkills: string[];
  missingSkills: string[];
  job?: JobDto;
  candidate?: CandidateProfile & { email?: string };
  createdAt: string;
}

