import type { ApiResponse } from './api-response.model';

/** Auth payload from System Authorisation/SignIn. */
export interface AuthState extends ApiResponse {
  id: string;
  token: string;
  refreshToken: string;
  userId: string;
  isServiceAccount: boolean;
  isSystemAdmin: boolean;
  permissions: string[];
  tokenValidTo: string;
  tenantId: string;
  tenantName: string;
  isCandCUser: boolean;
  applicationId: string;
  applicationName: string;
  environmentId: string;
  environmentName: string;
}

export interface AuthSession {
  userId: string;
  tenantId: string;
  tenantName: string;
  emailAddress?: string;
  isSystemAdmin: boolean;
  permissions: string[];
}
