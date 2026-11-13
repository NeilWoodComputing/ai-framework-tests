import type { AbstractIdentifiable } from '../models/abstract-identifiable';
import type { SearchRequest } from '../models/search-request';
import type { PagingResponse, SearchResponse } from '../models/search-response';

type PagedSearchResponseInput<TListItem extends AbstractIdentifiable> = SearchResponse<TListItem> & {
  totalRecords?: number;
  totalRows?: number;
  totalPages?: number;
  totalCount?: number;
};

/** Maps common Unity API paging shapes onto the framework SearchResponse contract. */
export function normalizePagedSearchResponse<TListItem extends AbstractIdentifiable>(
  response: PagedSearchResponseInput<TListItem> | null | undefined,
  searchRequest: SearchRequest
): SearchResponse<TListItem> {
  const raw = response as (PagedSearchResponseInput<TListItem> & Record<string, unknown>) | null | undefined;
  const data = (response?.data ?? raw?.['Data'] ?? []) as TListItem[];
  const apiPagination = response?.pagination ?? (raw?.['Pagination'] as PagingResponse | undefined);
  const pageSize = searchRequest.pageSize || 10;

  const totalRows =
    apiPagination?.totalRows ??
    response?.pagination?.totalRows ??
    response?.totalRecords ??
    response?.totalCount ??
    response?.totalRows ??
    data.length;

  const totalPages =
    apiPagination?.totalPages ??
    response?.pagination?.totalPages ??
    response?.totalPages ??
    Math.ceil(totalRows / pageSize);

  return {
    ...response,
    data,
    pagination: {
      ...apiPagination,
      ...response?.pagination,
      totalRows,
      totalPages,
    },
  };
}
