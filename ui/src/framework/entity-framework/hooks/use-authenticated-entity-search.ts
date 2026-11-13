'use client';

import { useAuth } from '@auth/context/AuthProvider';
import type { AbstractIdentifiable } from '../models/abstract-identifiable';
import type { SearchRequest } from '../models/search-request';
import type { AbstractSearchDataProvider } from '../providers/abstract-search.data-provider';
import {
  useEntitySearchByQueryState,
  useEntitySearchState,
  type EntitySearchState,
} from './use-entity-search-state';

type SearchParams = SearchRequest & { searchText?: string };

type AuthenticatedEntitySearchResult<
  TListItem extends AbstractIdentifiable,
  TSearchRequest extends SearchParams,
> = {
  searchState: EntitySearchState<TListItem, TSearchRequest>;
  authInFlight: boolean;
  isAuthenticated: boolean;
};

/**
 * Query-synced search that waits for auth — for full-page grids.
 */
export function useAuthenticatedEntitySearch<
  TListItem extends AbstractIdentifiable,
  TSearchRequest extends SearchParams,
>(
  provider: AbstractSearchDataProvider<TListItem, TSearchRequest>,
  searchDefaults: Partial<TSearchRequest> = {}
): AuthenticatedEntitySearchResult<TListItem, TSearchRequest> {
  const { session, inFlight: authInFlight } = useAuth();
  const isAuthenticated = Boolean(session);
  const searchState = useEntitySearchByQueryState(provider, searchDefaults, {
    enabled: !authInFlight && isAuthenticated,
  });

  return { searchState, authInFlight, isAuthenticated };
}

/**
 * In-memory search that waits for auth — for modal grids (no URL query churn).
 */
export function useAuthenticatedEntitySearchLocal<
  TListItem extends AbstractIdentifiable,
  TSearchRequest extends SearchParams,
>(
  provider: AbstractSearchDataProvider<TListItem, TSearchRequest>,
  searchDefaults: Partial<TSearchRequest> = {}
): AuthenticatedEntitySearchResult<TListItem, TSearchRequest> {
  const { session, inFlight: authInFlight } = useAuth();
  const isAuthenticated = Boolean(session);
  const searchState = useEntitySearchState(provider, searchDefaults, {
    enabled: !authInFlight && isAuthenticated,
  });

  return { searchState, authInFlight, isAuthenticated };
}
