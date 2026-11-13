import { normalizeApiRoot } from './api-url';

/**
 * Public runtime settings. Values come from environment variable names only;
 * there are no hardcoded API URLs, application ids or secrets here (T-SETUP-002 / S4).
 *
 * Neil sets `NEXT_PUBLIC_SYSTEM_API_ROOT` in `.env.local` (see `.env.example`).
 * `NEXT_PUBLIC_SYSTEM_APP_ID` is read for the auth module's unused sign-in helper;
 * this app has no sign-in (T-SETUP-002). Next.js inlines `NEXT_PUBLIC_*` at build / dev-server start.
 */
export const environment = {
  apiRoot: normalizeApiRoot(process.env.NEXT_PUBLIC_SYSTEM_API_ROOT ?? ''),
  appId: process.env.NEXT_PUBLIC_SYSTEM_APP_ID ?? '',
};
