import type { AuthSession, AuthState } from './models/auth-state.model';

export function toAuthSession(authState: AuthState, emailAddress: string): AuthSession {
  return {
    userId: authState.userId,
    tenantId: authState.tenantId,
    tenantName: authState.tenantName,
    emailAddress: emailAddress.toLowerCase(),
    isSystemAdmin: authState.isSystemAdmin,
    permissions: authState.permissions ?? [],
  };
}
