import { buildApiUrl } from './api-url';
import { environment } from './environment';

const url = (path: string) => buildApiUrl(environment.apiRoot, path);

/**
 * API routes, resolved against `NEXT_PUBLIC_SYSTEM_API_ROOT` (`environment.apiRoot`).
 * Authorisation paths exist so the unused auth module type-checks; this app has no sign-in.
 * Fish CRUD paths are added in T-FISH-002 (#25).
 */
export const apiRoutes = {
  authorisation: {
    signIn: url('Authorisation/SignIn'),
    refreshToken: url('Authorisation/refreshtoken'),
  },
} as const;
