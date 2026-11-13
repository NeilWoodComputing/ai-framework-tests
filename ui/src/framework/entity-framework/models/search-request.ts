export type SortDirection = 'asc' | 'desc' | '';

export interface SearchRequest {
  pageSize: number;
  pageIndex: number;
  sortBy: string;
  sortDirection: SortDirection;
  presetKey?: string;
}

export const defaultSearchRequest: SearchRequest = {
  sortBy: '',
  sortDirection: '',
  pageSize: 10,
  pageIndex: 0,
};

export function getSearchRequest(values: Partial<SearchRequest>): SearchRequest {
  return { ...defaultSearchRequest, ...values };
}
