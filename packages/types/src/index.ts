export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  COMPANY_OWNER = 'COMPANY_OWNER',
  RECRUITER = 'RECRUITER',
  HIRING_MANAGER = 'HIRING_MANAGER',
  ADS_MANAGER = 'ADS_MANAGER',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
}

export type JobTypePreference =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'INTERNSHIP'
  | 'REMOTE';

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
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
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
  location?: string | null;
  expectedSalaryMin?: number | null;
  expectedSalaryMax?: number | null;
  salaryCurrency?: string | null;
  jobTypePreference?: JobTypePreference | null;
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
  location?: string;
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  salaryCurrency?: string;
  jobTypePreference?: JobTypePreference;
  avatarUrl?: string;
  resumeUrl?: string;
}

export interface UpdateCandidateProfileDto {
  fullName?: string;
  headline?: string;
  bio?: string;
  skills?: string[];
  location?: string;
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  salaryCurrency?: string;
  jobTypePreference?: JobTypePreference;
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

export interface AvatarUploadResponse {
  avatarUrl: string;
  key?: string;
}

export interface MeResponse {
  user: UserDto;
  candidateProfile?: CandidateProfile | null;
  companyProfile?: CompanyProfile | null;
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
