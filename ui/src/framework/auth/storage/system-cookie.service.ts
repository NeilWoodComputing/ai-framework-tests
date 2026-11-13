'use client';

import {
  AUTH_SESSION_STORAGE_KEY,
  JWT_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REMEMBER_EMAIL_COOKIE,
} from '@auth/constants/auth-cookies';
import type { AuthSession, AuthState } from '@auth/models/auth-state.model';

const millisecondsPerDay = 86_400_000;
const defaultCookieExpiryDays = 30;
const cookieExpiryDate1970 = 'Thu, 01 Jan 1970 00:00:00 UTC';

function setCookie(name: string, value: string, days = defaultCookieExpiryDays): void {
  if (typeof document === 'undefined') return;

  const expires = new Date(Date.now() + days * millisecondsPerDay).toUTCString();
  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/${secure}; SameSite=Lax`;
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';

  const cookieValue =
    document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`))
      ?.split('=')
      .slice(1)
      .join('=') ?? '';

  try {
    return decodeURIComponent(cookieValue);
  } catch {
    return cookieValue;
  }
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=; expires=${cookieExpiryDate1970}; path=/`;
}

export const systemCookieService = {
  setJWT(token: string): void {
    setCookie(JWT_COOKIE, token);
  },

  getJWT(): string {
    return getCookie(JWT_COOKIE);
  },

  setRefreshToken(refreshToken: string): void {
    setCookie(REFRESH_TOKEN_COOKIE, refreshToken);
  },

  getRefreshToken(): string {
    return getCookie(REFRESH_TOKEN_COOKIE);
  },

  setAuthState(authState: AuthState): void {
    this.setJWT(authState.token);
    this.setRefreshToken(authState.refreshToken);
  },

  setSession(session: AuthSession): void {
    if (typeof sessionStorage === 'undefined') return;

    sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  },

  getSession(): AuthSession | null {
    if (typeof sessionStorage === 'undefined') return null;

    const raw = sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  },

  getRememberedEmail(): string {
    return getCookie(REMEMBER_EMAIL_COOKIE);
  },

  setRememberedEmail(emailAddress: string): void {
    setCookie(REMEMBER_EMAIL_COOKIE, emailAddress.toLowerCase());
  },

  clearRememberedEmail(): void {
    deleteCookie(REMEMBER_EMAIL_COOKIE);
  },

  clearAuthState(): void {
    deleteCookie(JWT_COOKIE);
    deleteCookie(REFRESH_TOKEN_COOKIE);
    sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('system-auth-cleared'));
    }
  },
};
