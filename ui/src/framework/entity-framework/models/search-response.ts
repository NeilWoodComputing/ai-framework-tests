import type { AbstractIdentifiable } from './abstract-identifiable';

export interface PagingResponse {
  totalRows: number;
  totalPages: number;
}

export interface SearchResponse<TListItem extends AbstractIdentifiable> {
  pagination?: PagingResponse;
  data: TListItem[];
}
