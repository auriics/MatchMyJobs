import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { config } from '../config/env.js';

export interface OAuthUserInfo {
  provider: 'google' | 'linkedin';
  providerUserId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export class OAuthService {
  private static googleClient = config.oauth.google.clientId
    ? new OAuth2Client(config.oauth.google.clientId)
    : null;

  /**
   * Verify Google OAuth Token (id_token or dev mock)
   */
  static async verifyGoogleToken(token: string): Promise<OAuthUserInfo> {
    // Development fallback if mock token used
    if (token.startsWith('mock-google-')) {
      const email = token.replace('mock-google-', '');
      return {
        provider: 'google',
        providerUserId: `google-mock-${email}`,
        email,
        name: email.split('@')[0],
      };
    }

    if (this.googleClient && config.oauth.google.clientId) {
      try {
        const ticket = await this.googleClient.verifyIdToken({
          idToken: token,
          audience: config.oauth.google.clientId,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          throw new Error('Google token payload missing email');
        }

        return {
          provider: 'google',
          providerUserId: payload.sub,
          email: payload.email,
          name: payload.name,
          avatarUrl: payload.picture,
        };
      } catch (err: unknown) {
        console.warn('[Google OAuth] verifyIdToken failed, checking UserInfo endpoint:', (err as Error).message);
      }
    }

    // Try Google UserInfo endpoint with Access Token
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.email) {
        return {
          provider: 'google',
          providerUserId: response.data.sub,
          email: response.data.email,
          name: response.data.name,
          avatarUrl: response.data.picture,
        };
      }
    } catch {
      // If no valid client configured, parse if it's JWT or return mock in dev
      if (config.isDev) {
        return {
          provider: 'google',
          providerUserId: 'google-dev-user-id',
          email: 'google.user@example.com',
          name: 'Google User',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        };
      }
      throw new Error('Invalid Google OAuth token');
    }

    throw new Error('Failed to verify Google OAuth token');
  }

  /**
   * Verify LinkedIn OAuth Token (access_token or auth code exchange)
   */
  static async verifyLinkedInToken(tokenOrCode: string): Promise<OAuthUserInfo> {
    // Development fallback
    if (tokenOrCode.startsWith('mock-linkedin-')) {
      const email = tokenOrCode.replace('mock-linkedin-', '');
      return {
        provider: 'linkedin',
        providerUserId: `linkedin-mock-${email}`,
        email,
        name: email.split('@')[0],
      };
    }

    let accessToken = tokenOrCode;

    // If it looks like an authorization code and client secret is configured, exchange it
    if (
      !tokenOrCode.startsWith('AQ') &&
      config.oauth.linkedin.clientId &&
      config.oauth.linkedin.clientSecret
    ) {
      try {
        const tokenRes = await axios.post(
          'https://www.linkedin.com/oauth/v2/accessToken',
          new URLSearchParams({
            grant_type: 'authorization_code',
            code: tokenOrCode,
            client_id: config.oauth.linkedin.clientId,
            client_secret: config.oauth.linkedin.clientSecret,
            redirect_uri: config.oauth.linkedin.redirectUri,
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
        accessToken = tokenRes.data.access_token;
      } catch (err: unknown) {
        console.warn('[LinkedIn OAuth] Code exchange failed, treating as direct token:', (err as Error).message);
      }
    }

    // Call LinkedIn OpenID UserInfo endpoint
    try {
      const response = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data && (response.data.email || response.data.sub)) {
        return {
          provider: 'linkedin',
          providerUserId: response.data.sub,
          email: response.data.email || `${response.data.sub}@linkedin.user`,
          name: response.data.name || `${response.data.given_name || ''} ${response.data.family_name || ''}`.trim(),
          avatarUrl: response.data.picture,
        };
      }
    } catch {
      if (config.isDev) {
        return {
          provider: 'linkedin',
          providerUserId: 'linkedin-dev-user-id',
          email: 'linkedin.user@example.com',
          name: 'LinkedIn Professional',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        };
      }
      throw new Error('Invalid LinkedIn OAuth token');
    }

    throw new Error('Failed to verify LinkedIn OAuth credentials');
  }
}
