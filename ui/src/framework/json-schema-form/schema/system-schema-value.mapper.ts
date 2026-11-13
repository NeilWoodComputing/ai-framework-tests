import type { SystemJsonSchema, SystemJsonSchemaProperty } from '../models/system-json-schema.model';
import { resolveSchemaOneOfConst } from './schema-one-of.dataset';

/**
 * Maps JsonForms data to API payloads using schema `modelPropertyName` keys.
 * Empty values are omitted. Non-empty values are always submitted — including fields
 * that are only conditionally required — so edit saves do not clear an existing email
 * when preferred contact switches to Telephone (and vice versa).
 */
export interface MapSystemSchemaValuesOptions {
  /** Send top-level array properties as `[]` when empty instead of omitting them (e.g. Animal.Attributes). */
  submitEmptyArrays?: boolean;
}

export function mapSystemSchemaValuesToApi(
  schema: SystemJsonSchema,
  formValue: Record<string, unknown> | null | undefined,
  options: MapSystemSchemaValuesOptions = {}
): Record<string, unknown> {
  const payload = formValue ? mapProperties(schema.properties ?? {}, formValue) : {};

  if (options.submitEmptyArrays) {
    for (const property of Object.values(schema.properties ?? {})) {
      if (property.type === 'array' && payload[property.modelPropertyName] === undefined) {
        payload[property.modelPropertyName] = [];
      }
    }
  }

  return payload;
}

function mapProperties(
  properties: Record<string, SystemJsonSchemaProperty>,
  formValue: Record<string, unknown>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const [key, property] of Object.entries(properties)) {
    const value = formValue[key];
    if (isEmptyValue(value)) {
      continue;
    }

    payload[property.modelPropertyName] = mapPropertyValue(property, value);
  }

  return payload;
}

function mapPropertyValue(property: SystemJsonSchemaProperty, value: unknown): unknown {
  if (property.type === 'object' && property.properties && value && typeof value === 'object') {
    return mapProperties(property.properties, value as Record<string, unknown>);
  }

  return value;
}

function readApiPropertyValue(
  apiRecord: Record<string, unknown>,
  property: SystemJsonSchemaProperty,
  formKey?: string
): unknown {
  const modelKey = property.modelPropertyName;
  if (modelKey && apiRecord[modelKey] !== undefined) {
    return apiRecord[modelKey];
  }

  const camelKey = modelKey ? modelKey.charAt(0).toLowerCase() + modelKey.slice(1) : '';
  if (camelKey && apiRecord[camelKey] !== undefined) {
    return apiRecord[camelKey];
  }

  if (formKey && apiRecord[formKey] !== undefined) {
    return apiRecord[formKey];
  }

  return undefined;
}

function mapApiPropertyValue(property: SystemJsonSchemaProperty, value: unknown): unknown {
  if (value == null) {
    return undefined;
  }

  if (property.type === 'object' && property.properties && typeof value === 'object') {
    return mapApiProperties(property.properties, value as Record<string, unknown>);
  }

  if (property.type === 'string' && property.format === 'date') {
    const dateValue = String(value);
    const match = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : undefined;
  }

  if (property.type === 'string' && Array.isArray(value) && value.length > 0) {
    value = value[0];
  }

  const oneOf = property.oneOf ?? property.items?.oneOf;
  if (oneOf?.length) {
    if (property.type === 'array' && Array.isArray(value)) {
      return value
        .map((item) => normalizeOneOfValue(oneOf, item))
        .filter((item): item is string => item != null);
    }

    return normalizeOneOfValue(oneOf, value);
  }

  return value;
}

/**
 * Maps an API oneOf value to the schema `const`, accepting either const or title matches.
 */
function normalizeOneOfValue(
  oneOf: NonNullable<SystemJsonSchemaProperty['oneOf']>,
  value: unknown
): string | undefined {
  if (value == null || value === '') {
    return undefined;
  }

  const normalized = resolveSchemaOneOfConst(oneOf, value);
  return normalized || undefined;
}

function mapApiProperties(
  properties: Record<string, SystemJsonSchemaProperty>,
  apiRecord: Record<string, unknown>
): Record<string, unknown> {
  const formValue: Record<string, unknown> = {};

  for (const [key, property] of Object.entries(properties)) {
    const apiValue = readApiPropertyValue(apiRecord, property, key);
    if (apiValue === undefined) {
      continue;
    }

    const mappedValue = mapApiPropertyValue(property, apiValue);
    if (property.type === 'array' && Array.isArray(mappedValue)) {
      formValue[key] = mappedValue;
      continue;
    }
    if (!isEmptyValue(mappedValue)) {
      formValue[key] = mappedValue;
    }
  }

  return formValue;
}

function unwrapApiEntityRecord(apiRecord: Record<string, unknown>): Record<string, unknown> {
  const dataEnvelope = apiRecord['data'] ?? apiRecord['Data'];
  if (dataEnvelope != null && typeof dataEnvelope === 'object' && !Array.isArray(dataEnvelope)) {
    return unwrapApiEntityRecord(dataEnvelope as Record<string, unknown>);
  }

  const recordEnvelope = apiRecord['record'] ?? apiRecord['Record'];
  if (recordEnvelope != null && typeof recordEnvelope === 'object' && !Array.isArray(recordEnvelope)) {
    return recordEnvelope as Record<string, unknown>;
  }

  return apiRecord;
}

/**
 * Maps API entity payloads to JsonForms data using schema property keys.
 */
export function mapApiValuesToSystemSchema(
  schema: SystemJsonSchema,
  apiRecord: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!apiRecord) {
    return {};
  }

  return mapApiProperties(schema.properties ?? {}, unwrapApiEntityRecord(apiRecord));
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).every(isEmptyValue);
  }

  return false;
}
