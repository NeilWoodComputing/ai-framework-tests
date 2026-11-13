/** Test UI base URL. Set BASE_URL (default http://localhost:3003). */
export function getBaseUrl(): string {
  return (process.env.BASE_URL || 'http://localhost:3003').replace(/\/$/, '');
}

/**
 * Test API base URL (API.Framework routes have no version segment).
 * Prefer API_URL. There is no hardcoded fallback host in this helper: when API_URL is
 * unset, later API steps should fail clearly rather than aiming at a guessed port.
 */
export function getApiUrl(): string {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error('API_URL is not set. Point it at the Fish Test API (no trailing /v1).');
  }
  const trimmed = apiUrl.trim().replace(/\/+$/, '');
  if (/\/v1$/i.test(trimmed)) {
    throw new Error(
      'API_URL ends with /v1, but API.Framework has no /v1 routes. ' +
        'Drop the trailing /v1 from the API_URL environment variable.'
    );
  }
  return trimmed;
}
