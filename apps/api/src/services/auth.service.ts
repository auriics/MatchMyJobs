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
import { Role } from '@prisma/client';
import { AuthResponse, UserDto, MeResponse } from '@antigravite/types';

export class AuthService {
  /**
   * Register a new user with chosen role
   */
  static async register(
    email: string,
    passwordPlain: string,
    role: Role,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthResponse> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    // 12 rounds bcrypt hash
    const passwordHash = await hashPassword(passwordPlain);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role,
        isEmailVerified: false,
      },
    });

    // Create session and generate tokens
    const { tokens } = await this.createSession(user.id, user.role, userAgent, ipAddress);

    return {
      user: this.mapToUserDto(user),
      tokens,
      hasProfile: false,
    };
  }

  /**
   * Standard Email + Password Login
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
      },
    });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password.');
    }

    const isValidPassword = await comparePassword(passwordPlain, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password.');
    }

    const { tokens } = await this.createSession(user.id, user.role, userAgent, ipAddress);

    const hasProfile = Boolean(
      (user.role === Role.CANDIDATE && user.candidateProfile) ||
      (user.role !== Role.CANDIDATE && user.companyProfile)
    );

    return {
      user: this.mapToUserDto(user),
      tokens,
      hasProfile,
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
      // Possible token theft - revoke session if found
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

    // Generate new Access Token
    const accessToken = generateAccessToken({
      userId: session.user.id,
      role: session.user.role,
    });

    // Optionally rotate refresh token
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

    // Check if OAuth account is already linked
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
          },
        },
      },
    });

    let user: any = oauthAccount?.user;

    if (!user) {
      // Check if user already exists by email
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          candidateProfile: true,
          companyProfile: true,
        },
      });

      if (!user) {
        // Create new user
        const assignedRole = roleChoice || Role.CANDIDATE;
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            role: assignedRole,
            isEmailVerified: true,
          },
          include: {
            candidateProfile: true,
            companyProfile: true,
          },
        });

        // If candidate role and name/avatar available, initialize partial candidate profile
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

      // Link OAuth account
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
      (user.role !== Role.CANDIDATE && user.companyProfile)
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
      },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    const hasProfile = Boolean(
      (user.role === Role.CANDIDATE && user.candidateProfile) ||
      (user.role !== Role.CANDIDATE && user.companyProfile)
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

    // Initial dummy hash to acquire session ID
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

  private static mapToUserDto(user: {
    id: string;
    email: string;
    role: Role;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): UserDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role as any,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
