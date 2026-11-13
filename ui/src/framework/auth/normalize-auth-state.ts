import type { ApiResponseErrorMessage } from './models/api-response.model';
import type { AuthState } from './models/auth-state.model';

/** Nested user object from API.Framework AuthenticationResponse. */
export interface AuthApiUser {
  id?: string;
  emailAddress?: string;
  displayName?: string;
  permissions?: string[];
  isSystemAdmin?: boolean;
  tenantId?: string;
  roles?: string[];
}

/**
 * Raw authorisation payload from either Unity.API (flat AuthState) or
 * API.Framework (`accessToken` + nested `user`).
 */
export type AuthApiPayload = Partial<AuthState> & {
  accessToken?: string;
  expiresUtc?: string;
  user?: AuthApiUser;
  errorMessages?: unknown;
};

function asString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function asPermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function asErrorMessages(value: unknown): ApiResponseErrorMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): ApiResponseErrorMessage | null => {
      if (typeof item === 'string') {
        return { message: item, httpStatusCode: 0, statusCode: '' };
      }
      if (item && typeof item === 'object' && 'message' in item) {
        const record = item as Record<string, unknown>;
        return {
          message: asString(record.message),
          httpStatusCode: Number(record.httpStatusCode ?? 0) || 0,
          statusCode: asString(record.statusCode),
        };
      }
      return null;
    })
    .filter((item): item is ApiResponseErrorMessage => item !== null && Boolean(item.message));
}

/**
 * Maps Unity.API or API.Framework sign-in / refresh payloads onto the System AuthState
 * shape the cookie service and SiteNav expect.
 */
export function normalizeAuthState(payload: AuthApiPayload): AuthState {
  const user = payload.user;
  const token = asString(payload.token || payload.accessToken);
  const permissions = asPermissions(
    payload.permissions !== undefined && payload.permissions !== null
      ? payload.permissions
      : user?.permissions
  );
  const userId = asString(payload.userId || user?.id);
  const tenantId = asString(payload.tenantId || user?.tenantId);
  const isSystemAdmin = Boolean(payload.isSystemAdmin ?? user?.isSystemAdmin ?? false);

  return {
    success: payload.success ?? Boolean(token),
    errorMessages: asErrorMessages(payload.errorMessages),
    statusCode: Number(payload.statusCode ?? 0) || 0,
    id: asString(payload.id || userId),
    token,
    refreshToken: asString(payload.refreshToken),
    userId,
    isServiceAccount: Boolean(payload.isServiceAccount ?? false),
    isSystemAdmin,
    permissions,
    tokenValidTo: asString(payload.tokenValidTo || payload.expiresUtc),
    tenantId,
    tenantName: asString(payload.tenantName),
    isCandCUser: Boolean(payload.isCandCUser ?? false),
    applicationId: asString(payload.applicationId),
    applicationName: asString(payload.applicationName),
    environmentId: asString(payload.environmentId),
    environmentName: asString(payload.environmentName),
  };
}

/** Email from an API.Framework nested user, when present. */
export function emailFromAuthPayload(payload: AuthApiPayload): string | undefined {
  const email = payload.user?.emailAddress?.trim();
  return email ? email.toLowerCase() : undefined;
}
