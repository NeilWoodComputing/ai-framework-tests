'use client';

import { readSystemApiJson, systemApiFetch } from '@/framework/api/system-api-fetch';

import type { SystemJsonSchema } from '../models/system-json-schema.model';
import { mapSystemSchemaFromApi } from '../schema/system-schema-api.mapper';

/** Schemas change with API deploys, not per open: reuse one for a few minutes. */
const SCHEMA_CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedSchema {
  promise: Promise<SystemJsonSchema>;
  expiresAt: number;
}

const schemaCache = new Map<string, CachedSchema>();

/** Drops cached schemas (all, or one endpoint). Also runs when auth is cleared (sign-out and token-refresh failure both dispatch `system-auth-cleared`). */
export function clearSystemJsonSchemaCache(schemaEndpoint?: string): void {
  if (schemaEndpoint) {
    schemaCache.delete(schemaEndpoint);
  } else {
    schemaCache.clear();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('system-auth-cleared', () => clearSystemJsonSchemaCache());
}

async function requestSystemJsonSchema(schemaEndpoint: string): Promise<SystemJsonSchema> {
  const response = await systemApiFetch(schemaEndpoint);
  if (!response.ok) {
    throw new Error(`Schema request failed: ${response.status}`);
  }

  const body = await readSystemApiJson<unknown>(response);
  return mapSystemSchemaFromApi(body);
}

/**
 * Loads a System JSON schema from a schema API endpoint. Concurrent and repeat calls share one
 * request (cached for {@link SCHEMA_CACHE_TTL_MS}); failures are not cached. Treat the returned
 * schema as read-only — it is shared by every form using that endpoint.
 */
export function fetchSystemJsonSchema(
  schemaEndpoint: string,
  options: { force?: boolean } = {}
): Promise<SystemJsonSchema> {
  const cached = schemaCache.get(schemaEndpoint);
  if (!options.force && cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const promise = requestSystemJsonSchema(schemaEndpoint);
  const entry: CachedSchema = { promise, expiresAt: Date.now() + SCHEMA_CACHE_TTL_MS };
  schemaCache.set(schemaEndpoint, entry);
  promise.catch(() => {
    if (schemaCache.get(schemaEndpoint) === entry) schemaCache.delete(schemaEndpoint);
  });
  return promise;
}

/** Warms the schema cache before a form modal opens (best effort, never throws). */
export function prefetchSystemJsonSchema(schemaEndpoint: string): Promise<void> {
  return fetchSystemJsonSchema(schemaEndpoint).then(
    () => undefined,
    () => undefined
  );
}
