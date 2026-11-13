'use client';

import type { EntitySearchState } from './use-entity-search-state';
import type { AbstractIdentifiable } from '../models/abstract-identifiable';
import type { SearchRequest } from '../models/search-request';

/** True while auth or the first search response for a grid is still pending. */
export function isEntityGridInitialLoad<
  TListItem extends AbstractIdentifiable,
  TSearchRequest extends SearchRequest,
>(
  authInFlight: boolean,
  isAuthenticated: boolean,
  searchState: Pick<EntitySearchState<TListItem, TSearchRequest>, 'inFlight' | 'searchResponse' | 'error'>
): boolean {
  return (
    authInFlight ||
    (isAuthenticated &&
      searchState.inFlight &&
      searchState.searchResponse === null &&
      !searchState.error)
  );
}
