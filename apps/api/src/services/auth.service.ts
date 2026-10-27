import { prisma } from '../config/prisma.js';
import { redisClient } from '../config/redis.js';
import { config } from '../config/env.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../utils/jwt.util.js';
import { OAuthService } from './oauth.service.js';
import { AuditService } from './audit.service.js';
import { Role } from '@prisma/client';
import { AuthResponse, UserDto, MeResponse } from '@antigravite/types';

export class AuthService {
  /**
   * Register a new user with chosen role.
   * Public registration is restricted strictly to CANDIDATE and COMPANY_OWNER.
   */
  static async register(
    email: string,
    passwordPlain: string,
    role: Role,
    companyName?: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthResponse> {
    const normalizedEmail = email.toLowerCase().trim();

    // Security Guard: Prevent any public registration of administrative or internal company roles
    if (
      role === Role.PLATFORM_ADMIN ||
      role === Role.ADMIN_MANAGER ||
      role === Role.RECRUITER ||
      role === Role.HIRING_MANAGER ||
      role === Role.ADS_MANAGER
    ) {
      await AuditService.log({
        action: 'SECURITY_ALERT_ILLEGAL_REGISTRATION_ROLE',
        resource: 'AUTH',
        userEmail: normalizedEmail,
        ipAddress,
        userAgent,
        details: { attemptedRole: role },
      });
      throw new Error(
        'Privileged and company internal roles cannot be registered publicly. They must be provisioned or invited by authorized administrators.'
      );
    }

    // Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    // 12 rounds bcrypt hash
    const passwordHash = await hashPassword(passwordPlain);

    // If company owner registers, create or link an organization
    let organizationId: string | undefined;
    let createdOrgName: string | undefined;

    if (role === Role.COMPANY_OWNER) {
      const orgName = companyName?.trim() || `${normalizedEmail.split('@')[0]}'s Organization`;
      const slug = `${orgName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

      const newCompany = await prisma.company.create({
        data: {
          name: orgName,
          slug,
          status: 'ACTIVE',
        },
      });

      organizationId = newCompany.id;
      createdOrgName = newCompany.name;
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role,
        organizationId,
        status: 'ACTIVE',
        isEmailVerified: false,
      },
      include: {
        organization: true,
      },
    });

    // If company owner, set company ownerId and create company profile
    if (role === Role.COMPANY_OWNER && organizationId) {
      await prisma.company.update({
        where: { id: organizationId },
        data: { ownerId: user.id },
      });

      await prisma.companyProfile.create({
        data: {
          userId: user.id,
          name: createdOrgName || 'Company',
        },
      });
    }

    // Record audit event
    await AuditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'USER_REGISTERED',
      resource: 'USER',
      resourceId: user.id,
      ipAddress,
      userAgent,
      details: { role: user.role, organizationId },
    });

    // Create session and generate tokens
    const { tokens } = await this.createSession(user.id, user.role, userAgent, ipAddress);

    return {
      user: this.mapToUserDto(user),
      tokens,
      hasProfile: role === Role.COMPANY_OWNER,
    };
  }

  /**
   * Standard Email + Password Login for Candidates and Company Users
   */
  static async login(
    email: string,
    passwordPlain: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthResponse> {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        candidateProfile: true,
        companyProfile: true,
        organization: true,
      },
    });

    if (!user || !user.passwordHash) {
      await AuditService.log({
        action: 'AUTH_LOGIN_FAILED',
        resource: 'AUTH',
        userEmail: normalizedEmail,
        ipAddress,
        userAgent,
        details: { reason: 'User not found or no password hash' },
      });
      throw new Error('Invalid email or password.');
    }

    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      await AuditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'AUTH_LOGIN_BLOCKED_SUSPENDED',
        resource: 'AUTH',
        ipAddress,
        userAgent,
      });
      throw new Error('Your account has been suspended or deactivated. Contact support.');
    }

    const isValidPassword = await comparePassword(passwordPlain, user.passwordHash);
    if (!isValidPassword) {
      await AuditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'AUTH_LOGIN_FAILED_PASSWORD',
        resource: 'AUTH',
        ipAddress,
        userAgent,
      });
      throw new Error('Invalid email or password.');
    }

    const { tokens } = await this.createSession(user.id, user.role, userAgent, ipAddress);

    await AuditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'AUTH_LOGIN_SUCCESS',
      resource: 'AUTH',
      ipAddress,
      userAgent,
    });

    const hasProfile = Boolean(
      (user.role === Role.CANDIDATE && user.candidateProfile) ||
      (user.role !== Role.CANDIDATE && (user.companyProfile || user.organization))
    );

    return {
      user: this.mapToUserDto(user),
      tokens,
      hasProfile,
    };
  }

  /**
   * Dedicated Platform Administrator Login
   * Strictly verifies that the authenticated user is a PLATFORM_ADMIN or ADMIN_MANAGER.
   */
  static async adminLogin(
    email: string,
    passwordPlain: string,
    mfaCode?: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthResponse> {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Uniform timing / generic message to prevent account enumeration
    if (!user || !user.passwordHash) {
      await AuditService.log({
        action: 'ADMIN_LOGIN_FAILED',
        resource: 'ADMIN',
        userEmail: normalizedEmail,
        ipAddress,
        userAgent,
        details: { reason: 'Account does not exist' },
      });
      throw new Error('Invalid email or password.');
    }

    // Role check: Only PLATFORM_ADMIN and ADMIN_MANAGER may authenticate here
    if (user.role !== Role.PLATFORM_ADMIN && user.role !== Role.ADMIN_MANAGER) {
      await AuditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'ADMIN_LOGIN_REJECTED_UNAUTHORIZED_ROLE',
        resource: 'ADMIN',
        ipAddress,
        userAgent,
        details: { attemptedRole: user.role },
      });
      throw new Error('Invalid email or password.');
    }

    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      await AuditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'ADMIN_LOGIN_BLOCKED_SUSPENDED',
        resource: 'ADMIN',
        ipAddress,
        userAgent,
      });
      throw new Error('Your administrative account has been suspended or deactivated.');
    }

    const isValidPassword = await comparePassword(passwordPlain, user.passwordHash);
    if (!isValidPassword) {
      await AuditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'ADMIN_LOGIN_FAILED_PASSWORD',
        resource: 'ADMIN',
        ipAddress,
        userAgent,
      });
      throw new Error('Invalid email or password.');
    }

    // Multi-factor authentication check if enabled
    if (user.mfaEnabled && user.mfaSecret) {
      if (!mfaCode) {
        throw new Error('Multi-Factor Authentication code is required.');
      }
      // Demo validation: in production this verifies TOTP RFC 6238
      if (mfaCode.length < 6) {
        throw new Error('Invalid Multi-Factor Authentication code.');
      }
    }

    const { tokens } = await this.createSession(user.id, user.role, userAgent, ipAddress);

    await AuditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'ADMIN_LOGIN_SUCCESS',
      resource: 'ADMIN',
      ipAddress,
      userAgent,
      details: { role: user.role, permissions: user.adminPermissions },
    });

    return {
      user: this.mapToUserDto(user),
      tokens,
      hasProfile: true,
    };
  }

  /**
   * Refresh Token flow
   */
  static async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new Error('Invalid or expired refresh token.');
    }

    const tokenHash = hashToken(refreshToken);

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });

    if (!session || session.isRevoked || session.refreshTokenHash !== tokenHash) {
      if (session) {
        await prisma.session.update({
          where: { id: session.id },
          data: { isRevoked: true },
        });
      }
      throw new Error('Invalid refresh token session.');
    }

    if (new Date() > session.expiresAt) {
      throw new Error('Refresh token has expired. Please log in again.');
    }

    if (session.user.status === 'SUSPENDED' || session.user.status === 'DEACTIVATED') {
      throw new Error('Account suspended.');
    }

    // Generate new Access Token
    const accessToken = generateAccessToken({
      userId: session.user.id,
      role: session.user.role,
    });

    // Rotate refresh token
    const newRefreshToken = generateRefreshToken({
      userId: session.user.id,
      sessionId: session.id,
    });
    const newHash = hashToken(newRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshExpiresInDays);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: newHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60, // 15 mins in seconds
    };
  }

  /**
   * Invalidate Refresh Token session on Logout
   */
  static async logout(refreshToken?: string, userId?: string): Promise<void> {
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await prisma.session.updateMany({
          where: { id: payload.sessionId },
          data: { isRevoked: true },
        });
      } catch {
        const tokenHash = hashToken(refreshToken);
        await prisma.session.updateMany({
          where: { refreshTokenHash: tokenHash },
          data: { isRevoked: true },
        });
      }
    }

    if (userId) {
      await redisClient.del(`user:${userId}`);
    }
  }

  /**
   * Google OAuth login / registration
   */
  static async googleAuth(
    token: string,
    roleChoice?: Role,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthResponse> {
    const oauthInfo = await OAuthService.verifyGoogleToken(token);
    return this.handleOAuthLogin(oauthInfo, roleChoice, userAgent, ipAddress);
  }

  /**
   * LinkedIn OAuth login / registration
   */
  static async linkedinAuth(
    tokenOrCode: string,
    roleChoice?: Role,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthResponse> {
    const oauthInfo = await OAuthService.verifyLinkedInToken(tokenOrCode);
    return this.handleOAuthLogin(oauthInfo, roleChoice, userAgent, ipAddress);
  }

  /**
   * Shared OAuth handler
   */
  private static async handleOAuthLogin(
    oauthInfo: { provider: string; providerUserId: string; email: string; name?: string; avatarUrl?: string },
    roleChoice?: Role,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthResponse> {
    const normalizedEmail = oauthInfo.email.toLowerCase().trim();

    // Prevent privileged roles from social registration
    const assignedRole = (roleChoice === Role.COMPANY_OWNER ? Role.COMPANY_OWNER : Role.CANDIDATE);

    let oauthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: oauthInfo.provider,
          providerUserId: oauthInfo.providerUserId,
        },
      },
      include: {
        user: {
          include: {
            candidateProfile: true,
            companyProfile: true,
            organization: true,
          },
        },
      },
    });

    let user: any = oauthAccount?.user;

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          candidateProfile: true,
          companyProfile: true,
          organization: true,
        },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            role: assignedRole,
            status: 'ACTIVE',
            isEmailVerified: true,
          },
          include: {
            candidateProfile: true,
            companyProfile: true,
            organization: true,
          },
        });

        if (assignedRole === Role.CANDIDATE && oauthInfo.name) {
          await prisma.candidateProfile.create({
            data: {
              userId: user.id,
              fullName: oauthInfo.name,
              avatarUrl: oauthInfo.avatarUrl,
              skills: [],
            },
          });
        }
      }

      await prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: oauthInfo.provider,
          providerUserId: oauthInfo.providerUserId,
        },
      });
    }

    const { tokens } = await this.createSession(user.id, user.role, userAgent, ipAddress);

    const hasProfile = Boolean(
      (user.role === Role.CANDIDATE && user.candidateProfile) ||
      (user.role !== Role.CANDIDATE && (user.companyProfile || user.organization))
    );

    return {
      user: this.mapToUserDto(user),
      tokens,
      hasProfile,
    };
  }

  /**
   * Current authenticated user details
   */
  static async getMe(userId: string): Promise<MeResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        candidateProfile: true,
        companyProfile: true,
        organization: true,
      },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    const hasProfile = Boolean(
      (user.role === Role.CANDIDATE && user.candidateProfile) ||
      (user.role !== Role.CANDIDATE && (user.companyProfile || user.organization))
    );

    return {
      user: this.mapToUserDto(user),
      candidateProfile: user.candidateProfile
        ? {
            ...user.candidateProfile,
            createdAt: user.candidateProfile.createdAt.toISOString(),
            updatedAt: user.candidateProfile.updatedAt.toISOString(),
            jobTypePreference: user.candidateProfile.jobTypePreference as any,
          }
        : null,
      companyProfile: user.companyProfile
        ? {
            ...user.companyProfile,
            createdAt: user.companyProfile.createdAt.toISOString(),
            updatedAt: user.companyProfile.updatedAt.toISOString(),
            size: user.companyProfile.size as any,
          }
        : null,
      organization: user.organization
        ? {
            id: user.organization.id,
            name: user.organization.name,
            slug: user.organization.slug,
            website: user.organization.website,
            industry: user.organization.industry,
            size: user.organization.size,
            description: user.organization.description,
            logoUrl: user.organization.logoUrl,
            location: user.organization.location,
            status: user.organization.status as any,
            ownerId: user.organization.ownerId,
            createdAt: user.organization.createdAt.toISOString(),
            updatedAt: user.organization.updatedAt.toISOString(),
          }
        : null,
      hasProfile,
    };
  }

  /**
   * Helper: create DB session and issue JWT access + refresh tokens
   */
  private static async createSession(
    userId: string,
    role: Role,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ sessionId: string; tokens: { accessToken: string; refreshToken: string; expiresIn: number } }> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshExpiresInDays);

    const session = await prisma.session.create({
      data: {
        userId,
        refreshTokenHash: 'pending',
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    const accessToken = generateAccessToken({ userId, role });
    const refreshToken = generateRefreshToken({ userId, sessionId: session.id });
    const refreshTokenHash = hashToken(refreshToken);

    await prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash },
    });

    return {
      sessionId: session.id,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes
      },
    };
  }

  private static mapToUserDto(user: any): UserDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role as any,
      status: (user.status || 'ACTIVE') as any,
      isEmailVerified: user.isEmailVerified,
      organizationId: user.organizationId || null,
      organizationName: user.organization?.name || null,
      adminPermissions: user.adminPermissions || [],
      mfaEnabled: user.mfaEnabled || false,
      createdAt: user.createdAt.toISOString ? user.createdAt.toISOString() : user.createdAt,
      updatedAt: user.updatedAt.toISOString ? user.updatedAt.toISOString() : user.updatedAt,
    };
  }
}
