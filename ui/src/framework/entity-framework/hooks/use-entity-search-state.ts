'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { AbstractIdentifiable } from '../models/abstract-identifiable';
import type { SearchRequest } from '../models/search-request';
import type { SearchResponse } from '../models/search-response';
import type { AbstractSearchDataProvider } from '../providers/abstract-search.data-provider';
import { defaultSearchRequest, getSearchRequest } from '../models/search-request';
import { searchRequestToQueryParams } from '../utils/search-query-params';

type SearchParams = SearchRequest & { searchText?: string };

function parseSearchFromQuery(params: URLSearchParams, defaults: SearchParams): SearchParams {
  const parsed: Record<string, unknown> = {
    ...defaults,
    pageSize: Number(params.get('pageSize') ?? defaults.pageSize),
    pageIndex: Number(params.get('pageIndex') ?? defaults.pageIndex),
    sortBy: params.get('sortBy') ?? defaults.sortBy,
    sortDirection: (params.get('sortDirection') as SearchRequest['sortDirection']) ?? defaults.sortDirection,
    presetKey: params.get('presetKey') ?? defaults.presetKey,
  };

  if (params.has('searchText')) {
    parsed.searchText = params.get('searchText') ?? '';
  }

  return getSearchRequest(parsed) as SearchParams;
}

export interface EntitySearchState<TListItem extends AbstractIdentifiable, TSearchRequest extends SearchRequest> {
  searchRequest: TSearchRequest;
  searchResponse: SearchResponse<TListItem> | null;
  inFlight: boolean;
  error: string | null;
  setSearchRequest: (patch: Partial<TSearchRequest>) => void;
  reload: () => void;
}

/**
 * Query-synced search state — mirrors EntitySearchByQueryStateService.
 */
export interface EntitySearchOptions {
  /** When false, skips API calls (e.g. wait for auth). Defaults to true. */
  enabled?: boolean;
}

export function useEntitySearchByQueryState<
  TListItem extends AbstractIdentifiable,
  TSearchRequest extends SearchParams,
>(
  provider: AbstractSearchDataProvider<TListItem, TSearchRequest>,
  searchDefaults: Partial<TSearchRequest> = {},
  options: EntitySearchOptions = {}
): EntitySearchState<TListItem, TSearchRequest> {
  const enabled = options.enabled ?? true;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultsRef = useRef(searchDefaults);
  defaultsRef.current = searchDefaults;

  const defaults = useMemo(
    () => getSearchRequest({ ...defaultSearchRequest, ...defaultsRef.current }) as TSearchRequest,
    []
  );

  const searchRequest = useMemo(
    () => parseSearchFromQuery(searchParams, defaults) as TSearchRequest,
    [searchParams, defaults]
  );

  const requestKey = useMemo(() => JSON.stringify(searchRequest), [searchRequest]);

  const [searchResponse, setSearchResponse] = useState<SearchResponse<TListItem> | null>(null);
  const [inFlight, setInFlight] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const setSearchRequest = useCallback(
    (patch: Partial<TSearchRequest>) => {
      const current = parseSearchFromQuery(searchParams, defaults) as TSearchRequest;
      const next = { ...current, ...patch } as TSearchRequest;
      const params = searchRequestToQueryParams(next);
      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();

      if (nextQuery === currentQuery) return;

      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    },
    [pathname, router, searchParams, defaults]
  );

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setInFlight(false);
      return undefined;
    }

    let cancelled = false;
    const request = parseSearchFromQuery(searchParams, defaults) as TSearchRequest;

    async function runSearch() {
      setInFlight(true);
      setError(null);

      try {
        const response = await provider.search(request);
        if (!cancelled) setSearchResponse(response);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Search failed');
          setSearchResponse(null);
        }
      } finally {
        if (!cancelled) setInFlight(false);
      }
    }

    void runSearch();

    return () => {
      cancelled = true;
    };
  }, [provider, requestKey, reloadToken, searchParams, defaults, enabled]);

  return {
    searchRequest,
    searchResponse,
    inFlight,
    error,
    setSearchRequest,
    reload,
  };
}

/**
 * In-memory entity search — no URL query sync. Prefer inside modals to avoid route churn.
 */
export function useEntitySearchState<
  TListItem extends AbstractIdentifiable,
  TSearchRequest extends SearchParams,
>(
  provider: AbstractSearchDataProvider<TListItem, TSearchRequest>,
  searchDefaults: Partial<TSearchRequest> = {},
  options: EntitySearchOptions = {}
): EntitySearchState<TListItem, TSearchRequest> {
  const enabled = options.enabled ?? true;

  const defaults = useMemo(
    () => getSearchRequest({ ...defaultSearchRequest, ...searchDefaults }) as TSearchRequest,
    [searchDefaults]
  );

  const [searchRequest, setSearchRequestState] = useState(defaults);
  const [searchResponse, setSearchResponse] = useState<SearchResponse<TListItem> | null>(null);
  const [inFlight, setInFlight] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const requestKey = useMemo(() => JSON.stringify(searchRequest), [searchRequest]);

  const setSearchRequest = useCallback((patch: Partial<TSearchRequest>) => {
    setSearchRequestState((current) => ({ ...current, ...patch }) as TSearchRequest);
  }, []);

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setInFlight(false);
      return undefined;
    }

    let cancelled = false;

    async function runSearch() {
      setInFlight(true);
      setError(null);

      try {
        const response = await provider.search(searchRequest);
        if (!cancelled) setSearchResponse(response);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Search failed');
          setSearchResponse(null);
        }
      } finally {
        if (!cancelled) setInFlight(false);
      }
    }

    void runSearch();

    return () => {
      cancelled = true;
    };
  }, [enabled, provider, reloadToken, requestKey, searchRequest]);

  return {
    searchRequest,
    searchResponse,
    inFlight,
    error,
    setSearchRequest,
    reload,
  };
}
