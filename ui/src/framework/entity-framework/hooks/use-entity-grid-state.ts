'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { AbstractIdentifiable } from '../models/abstract-identifiable';
import type { SearchRequest } from '../models/search-request';
import type { PageChangedEvent } from '../grid/page-changed-event';
import type { AbstractUpdatedService } from '../services/abstract-updated.service';
import type { EntitySearchState } from './use-entity-search-state';
import type { GridColumn } from '../grid/grid-column';
import type { EntityGridConfig } from '../grid/entity-grid-config';

export interface EntityGridState<TListItem extends AbstractIdentifiable, TSearchRequest extends SearchRequest> {
  config: EntityGridConfig<TListItem>;
  columns: GridColumn<TListItem>[];
  entities: TListItem[];
  totalRows: number;
  inFlight: boolean;
  error: string | null;
  searchRequest: TSearchRequest;
  onPageChanged: (event: PageChangedEvent) => void;
  setSort: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
  reload: () => void;
}

/**
 * Grid orchestration — mirrors AbstractEntityGridStateService (simplified).
 */
export function useEntityGridState<
  TListItem extends AbstractIdentifiable,
  TSearchRequest extends SearchRequest,
>(
  config: EntityGridConfig<TListItem>,
  columns: GridColumn<TListItem>[],
  searchState: EntitySearchState<TListItem, TSearchRequest>,
  updateService?: AbstractUpdatedService
): EntityGridState<TListItem, TSearchRequest> {
  const reloadRef = useRef(searchState.reload);
  reloadRef.current = searchState.reload;

  useEffect(() => {
    if (!updateService) return undefined;
    return updateService.subscribe(() => reloadRef.current());
  }, [updateService]);

  const onPageChanged = useCallback(
    (event: PageChangedEvent) => {
      searchState.setSearchRequest(event as Partial<TSearchRequest>);
    },
    [searchState]
  );

  const setSort = useCallback(
    (sortBy: string, sortDirection: 'asc' | 'desc') => {
      searchState.setSearchRequest({ sortBy, sortDirection, pageIndex: 0 } as Partial<TSearchRequest>);
    },
    [searchState]
  );

  return {
    config,
    columns,
    entities: searchState.searchResponse?.data ?? [],
    totalRows: searchState.searchResponse?.pagination?.totalRows ?? 0,
    inFlight: searchState.inFlight,
    error: searchState.error,
    searchRequest: searchState.searchRequest,
    onPageChanged,
    setSort,
    reload: searchState.reload,
  };
}
