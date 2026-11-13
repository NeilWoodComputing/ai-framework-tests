'use client';

import { apiRoutes } from '@/config/api-routes';
import { isSystemApiSuccess, readSystemApiJson, systemApiFetch } from '@/framework/api/system-api-fetch';
import { toAuthSession } from './auth-session.utils';
import type { AuthApiPayload } from './normalize-auth-state';
import { emailFromAuthPayload, normalizeAuthState } from './normalize-auth-state';
import { systemCookieService } from './storage/system-cookie.service';

let refreshInFlight: Promise<boolean> | null = null;

/** Refreshes JWT from rT cookie — mirrors Angular TokenRefreshService (single in-flight request). */
export async function refreshAuthToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = systemCookieService.getRefreshToken();
    if (!refreshToken) return false;

    const url = `${apiRoutes.authorisation.refreshToken}?refreshToken=${encodeURIComponent(refreshToken)}`;

    try {
      const response = await systemApiFetch(url, {
        method: 'POST',
        skipAuth: true,
        skipRefresh: true,
      });

      const raw = await readSystemApiJson<AuthApiPayload>(response);
      const body = normalizeAuthState(raw);
      if (!isSystemApiSuccess(response, body) || !body.token) {
        systemCookieService.clearAuthState();
        return false;
      }

      systemCookieService.setAuthState(body);

      const existingSession = systemCookieService.getSession();
      systemCookieService.setSession(
        toAuthSession(
          body,
          existingSession?.emailAddress || emailFromAuthPayload(raw) || ''
        )
      );

      window.dispatchEvent(new Event('system-auth-refreshed'));
      return true;
    } catch {
      systemCookieService.clearAuthState();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
