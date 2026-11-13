import type { SearchRequest } from '../models/search-request';

function shouldOmitParam(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (value === 'undefined') return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/** Builds query params from a search request — mirrors Angular `convertToHttpParams`. */
export function searchRequestToQueryParams<T extends SearchRequest>(
  searchRequest: T
): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(searchRequest).forEach(([key, value]) => {
    if (!shouldOmitParam(value)) {
      params.set(key, String(value));
    }
  });

  return params;
}
