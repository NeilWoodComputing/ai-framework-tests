'use client';

import type { ApiResponse } from '@auth/models/api-response.model';
import { refreshAuthToken } from '@auth/token-refresh.service';
import { systemCookieService } from '@auth/storage/system-cookie.service';

export interface SystemApiFetchInit extends RequestInit {
  /** Skip Authorization header (sign-in, refresh). */
  skipAuth?: boolean;
  /** Internal: skip 401 refresh retry (refresh endpoint itself). */
  skipRefresh?: boolean;
}

type ApiBody = Partial<ApiResponse> & {
  token?: string;
  accessToken?: string;
  message?: string;
};

const UNAUTHENTICATED_URL_PATTERNS = [/SignIn/i, /refreshtoken/i] as const;

export function isUnauthenticatedSystemApiUrl(url: string): boolean {
  return UNAUTHENTICATED_URL_PATTERNS.some((pattern) => pattern.test(url));
}

export function isSystemApiSuccess(response: Response, body: ApiBody): boolean {
  const hasToken = Boolean(body.token || body.accessToken);
  if (body.success === true) return hasToken;
  return response.ok && hasToken;
}

export async function readSystemApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    throw new Error('System API returned an empty response.');
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`System API returned non-JSON (${response.status}): ${text.slice(0, 200)}`);
  }
}

async function performFetch(url: string, init: SystemApiFetchInit): Promise<Response> {
  const { skipAuth, headers, ...rest } = init;
  const token = skipAuth ? undefined : systemCookieService.getJWT();

  try {
    return await fetch(url, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(
      `Unable to reach System API (${detail}). Check the API is running and CORS allows this app origin.`
    );
  }
}

/** Authenticated fetch to the System API (see {@link apiRoutes}). */
export async function systemApiFetch(url: string, init: SystemApiFetchInit = {}): Promise<Response> {
  const response = await performFetch(url, init);

  if (
    response.status !== 401 ||
    init.skipAuth ||
    init.skipRefresh ||
    isUnauthenticatedSystemApiUrl(url)
  ) {
    return response;
  }

  const refreshed = await refreshAuthToken();
  if (!refreshed) return response;

  return performFetch(url, init);
}
