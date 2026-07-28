import { create } from 'zustand';
import * as authApi from '../services/authApi.js';

const TOKEN_KEY = 'hackforge_access_token';
const REFRESH_KEY = 'hackforge_refresh_token';
const DEV_MOCKS_ENABLED = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_MOCKS === 'true';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: localStorage.getItem(TOKEN_KEY) || null,
  refreshToken: localStorage.getItem(REFRESH_KEY) || null,
  isAuthenticated: false,
  isLoading: true, // true until initial session restore completes

  /**
   * Called after successful login or register — persists tokens and user.
   */
  setAuth: (tokens, user) => {
    localStorage.setItem(TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    localStorage.setItem('hackforge_user', JSON.stringify(user));
    set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  /**
   * Clear everything — used on logout or 401.
   */
  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem('hackforge_user');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  /**
   * Called once on app start to restore the session from stored tokens.
   */
  restoreSession: async () => {
    const token = get().accessToken;
    if (!token) {
      set({ isLoading: false });
      return;
    }

    if (DEV_MOCKS_ENABLED && token === 'dev-access-token') {
      const user = JSON.parse(localStorage.getItem('hackforge_user')) || {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'dev@dev.com',
        full_name: 'Dev User (ORGANIZER)',
        role: 'organizer',
        org_name: 'Dev Organization',
        is_active: true
      };
      set({ user, isAuthenticated: true, isLoading: false });
      return;
    }

    if (token === 'dev-access-token') {
      get().clearAuth();
      return;
    }

    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      // Token might be expired — try refresh
      const refresh = get().refreshToken;
      if (refresh) {
        try {
          const tokens = await authApi.refreshToken(refresh);
          localStorage.setItem(TOKEN_KEY, tokens.access_token);
          localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
          set({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
          const user = await authApi.getMe();
          localStorage.setItem('hackforge_user', JSON.stringify(user));
          set({ user, isAuthenticated: true, isLoading: false });
          return;
        } catch {
          // Refresh also failed
        }
      }
      // Give up — clear everything
      get().clearAuth();
    }
  },

  /**
   * Convenience logout.
   */
  logout: () => {
    get().clearAuth();
  },
}));
