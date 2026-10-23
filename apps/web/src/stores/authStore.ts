import { create } from 'zustand';
import {
  UserDto,
  AuthTokens,
  CandidateProfile,
  CompanyProfile,
  AuthResponse,
} from '@antigravite/types';
import { apiClient } from '../lib/axios';

interface AuthState {
  user: UserDto | null;
  tokens: AuthTokens | null;
  candidateProfile: CandidateProfile | null;
  companyProfile: CompanyProfile | null;
  hasProfile: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuth: (data: AuthResponse) => void;
  updateTokens: (tokens: { accessToken: string; refreshToken?: string; expiresIn: number }) => void;
  setCandidateProfile: (profile: CandidateProfile) => void;
  setCompanyProfile: (profile: CompanyProfile) => void;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

// Initial state from localStorage if available
const storedUser = localStorage.getItem('antigravite_user');
const storedTokens = localStorage.getItem('antigravite_tokens');

export const useAuthStore = create<AuthState>((set, get) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  tokens: storedTokens ? JSON.parse(storedTokens) : null,
  candidateProfile: null,
  companyProfile: null,
  hasProfile: false,
  isLoading: false,
  isAuthenticated: Boolean(storedUser && storedTokens),

  setAuth: (data: AuthResponse) => {
    localStorage.setItem('antigravite_user', JSON.stringify(data.user));
    localStorage.setItem('antigravite_tokens', JSON.stringify(data.tokens));

    set({
      user: data.user,
      tokens: data.tokens,
      hasProfile: data.hasProfile,
      isAuthenticated: true,
    });
  },

  updateTokens: (tokens) => {
    const current = get().tokens;
    const updated: AuthTokens = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || current?.refreshToken || '',
      expiresIn: tokens.expiresIn,
    };

    localStorage.setItem('antigravite_tokens', JSON.stringify(updated));
    set({ tokens: updated });
  },

  setCandidateProfile: (profile: CandidateProfile) => {
    set({ candidateProfile: profile, hasProfile: true });
  },

  setCompanyProfile: (profile: CompanyProfile) => {
    set({ companyProfile: profile, hasProfile: true });
  },

  fetchMe: async () => {
    try {
      set({ isLoading: true });
      const res = await apiClient.get('/auth/me');
      const data = res.data.data;

      set({
        user: data.user,
        candidateProfile: data.candidateProfile || null,
        companyProfile: data.companyProfile || null,
        hasProfile: data.hasProfile,
        isAuthenticated: true,
        isLoading: false,
      });

      localStorage.setItem('antigravite_user', JSON.stringify(data.user));
    } catch (err) {
      set({ isLoading: false });
      // If unauthorized, logout
      get().logout();
    }
  },

  logout: async () => {
    try {
      const storedRefreshToken = get().tokens?.refreshToken;
      await apiClient.post('/auth/logout', { refreshToken: storedRefreshToken });
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('antigravite_user');
      localStorage.removeItem('antigravite_tokens');

      set({
        user: null,
        tokens: null,
        candidateProfile: null,
        companyProfile: null,
        hasProfile: false,
        isAuthenticated: false,
      });
    }
  },
}));
