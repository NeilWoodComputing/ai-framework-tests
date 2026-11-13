'use client';

import { apiRoutes } from '@/config/api-routes';
import { environment } from '@/config/environment';
import { isSystemApiSuccess, readSystemApiJson, systemApiFetch } from '@/framework/api/system-api-fetch';
import { getErrorMessage } from '@entity-framework/utils/api-error.utils';
import { toAuthSession } from '../auth-session.utils';
import type { AuthApiPayload } from '../normalize-auth-state';
import { emailFromAuthPayload, normalizeAuthState } from '../normalize-auth-state';
import type { AuthSession, AuthState } from '../models/auth-state.model';
import { refreshAuthToken } from '../token-refresh.service';
import { systemCookieService } from '../storage/system-cookie.service';

export interface SignInRequest {
  emailAddress: string;
  password: string;
  rememberMe?: boolean;
}

export class AuthorisationDataProvider {
  async signIn(request: SignInRequest): Promise<AuthState> {
    const response = await systemApiFetch(apiRoutes.authorisation.signIn, {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({
        emailAddress: request.emailAddress.toLowerCase(),
        password: request.password,
        applicationEnvironmentId: environment.appId,
        rememberMe: request.rememberMe ?? false,
      }),
    });

    const raw = await readSystemApiJson<AuthApiPayload>(response);
    const body = normalizeAuthState(raw);

    if (!isSystemApiSuccess(response, body) || !body.token) {
      const error = new Error(getErrorMessage(raw, 'Sign in failed')) as Error & { body?: unknown };
      error.body = raw;
      throw error;
    }

    systemCookieService.setAuthState(body);
    systemCookieService.setSession(
      toAuthSession(body, request.emailAddress || emailFromAuthPayload(raw) || '')
    );

    if (request.rememberMe) {
      systemCookieService.setRememberedEmail(request.emailAddress);
    } else {
      systemCookieService.clearRememberedEmail();
    }

    return body;
  }

  async signOut(): Promise<void> {
    systemCookieService.clearAuthState();
  }

  async getSession(): Promise<AuthSession | null> {
    if (!systemCookieService.getJWT()) {
      if (!systemCookieService.getRefreshToken()) return null;

      const refreshed = await refreshAuthToken();
      if (!refreshed) return null;
    }

    return systemCookieService.getSession();
  }
}
