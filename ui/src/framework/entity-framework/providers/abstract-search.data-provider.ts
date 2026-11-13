'use client';

import { readSystemApiJson, systemApiFetch } from '@/framework/api/system-api-fetch';
import type { ApiResponse } from '@auth/models/api-response.model';

import type { AbstractIdentifiable } from '../models/abstract-identifiable';
import type { SearchRequest } from '../models/search-request';
import type { SearchResponse } from '../models/search-response';
import { getErrorMessage } from '../utils/api-error.utils';
import { normalizePagedSearchResponse } from '../utils/normalize-paged-search-response';
import { searchRequestToQueryParams } from '../utils/search-query-params';

export abstract class AbstractSearchDataProvider<
  TListItem extends AbstractIdentifiable,
  TSearchRequest extends SearchRequest,
> {
  protected useQueryForParameters = true;

  protected abstract searchEndpoint(): string;

  async search(searchRequest: TSearchRequest): Promise<SearchResponse<TListItem>> {
    if (this.useQueryForParameters) {
      return this.searchByQuery(searchRequest);
    }
    return this.searchByPost(searchRequest);
  }

  protected async parseSearchResponse(
    response: Response,
    searchRequest: TSearchRequest
  ): Promise<SearchResponse<TListItem>> {
    const body = await readSystemApiJson<SearchResponse<TListItem> & ApiResponse>(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(body, `Search failed: ${response.status}`));
    }

    return normalizePagedSearchResponse(body, searchRequest);
  }

  protected async searchByQuery(searchRequest: TSearchRequest): Promise<SearchResponse<TListItem>> {
    const params = searchRequestToQueryParams(searchRequest);
    const url = `${this.searchEndpoint()}?${params.toString()}`;
    const response = await systemApiFetch(url);
    return this.parseSearchResponse(response, searchRequest);
  }

  protected async searchByPost(searchRequest: TSearchRequest): Promise<SearchResponse<TListItem>> {
    const response = await systemApiFetch(this.searchEndpoint(), {
      method: 'POST',
      body: JSON.stringify(searchRequest),
    });
    return this.parseSearchResponse(response, searchRequest);
  }
}
