'use client';

import { readSystemApiJson, systemApiFetch } from '@/framework/api/system-api-fetch';

import type { AbstractIdentifiable } from '../models/abstract-identifiable';
import { ApiRequestError, readApiErrorBody } from '../utils/api-error.utils';

async function failure(response: Response, action: string): Promise<ApiRequestError> {
  return new ApiRequestError(`${action} failed: ${response.status}`, response.status, await readApiErrorBody(response));
}

function unwrapEntityRecord<T>(body: unknown): T {
  if (!body || typeof body !== 'object') {
    return body as T;
  }

  const record = body as Record<string, unknown>;
  const data = record.data ?? record.Data;
  if (data != null && typeof data === 'object' && !Array.isArray(data)) {
    return unwrapEntityRecord<T>(data);
  }

  return body as T;
}

export abstract class AbstractEntityDataProvider<TEntity extends AbstractIdentifiable> {
  protected abstract apiRoot: string;
  protected parentPath?: string;
  protected childId?: string;

  setParentPath(parentId: string): void {
    this.parentPath = parentId;
  }

  protected getBaseEndpoint(): string {
    return this.parentPath ? `${this.apiRoot}/${this.parentPath}` : this.apiRoot;
  }

  protected getEndpoint(): string {
    const base = this.getBaseEndpoint();
    return this.childId ? `${base}/${this.childId}` : base;
  }

  async read(): Promise<TEntity> {
    const response = await systemApiFetch(this.getBaseEndpoint());
    if (!response.ok) throw await failure(response, 'Read');
    const body = await readSystemApiJson<unknown>(response);
    return unwrapEntityRecord<TEntity>(body);
  }

  async create(entity: TEntity): Promise<AbstractIdentifiable> {
    const response = await systemApiFetch(this.getBaseEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entity),
    });
    if (!response.ok) throw await failure(response, 'Create');
    const body = await readSystemApiJson<unknown>(response);
    return unwrapEntityRecord<AbstractIdentifiable>(body);
  }

  async update(entity: TEntity): Promise<void> {
    const response = await systemApiFetch(this.getEndpoint(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entity),
    });
    if (!response.ok) throw await failure(response, 'Update');
  }

  async deleteById(id: string): Promise<void> {
    const response = await systemApiFetch(`${this.apiRoot}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw await failure(response, 'Delete');
  }
}
