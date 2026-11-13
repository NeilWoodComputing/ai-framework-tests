import { createAjv } from '@jsonforms/core';

import type {
  SystemJsonSchema,
  SystemJsonSchemaConstraint,
  SystemJsonSchemaMessages,
  SystemJsonSchemaProperty,
} from '../models/system-json-schema.model';
import { toJsonFormsSchema } from '../schema/system-schema.adapter';

type AjvInstance = ReturnType<typeof createAjv>;
type AjvValidateFunction = ReturnType<AjvInstance['compile']>;

/**
 * JsonForms `additionalErrors` entry. `@jsonforms/react` types this as Ajv's ErrorObject
 * with a required `dataPath` (Ajv v6); we supply both `instancePath` and `dataPath`.
 */
export type SystemSchemaErrorObject = {
  instancePath: string;
  dataPath: string;
  schemaPath: string;
  keyword: string;
  params: Record<string, unknown>;
  message?: string;
};

/** Field errors keyed by root schema property (e.g. `name`, `attributes`), `_form` for record-level. */
export type SystemSchemaFieldErrors = Record<string, string[]>;

export interface SystemSchemaValidationResult {
  valid: boolean;
  fieldErrors: SystemSchemaFieldErrors;
}

const ajv: AjvInstance = createAjv({ allErrors: true, strict: false });
const validatorCache = new WeakMap<SystemJsonSchema, AjvValidateFunction>();

/** Ajv keyword -> schema `messages` key (same keys the API's RecordSchemaValidator uses). */
const MESSAGE_KEYS: Record<string, string> = {
  required: 'required',
  minLength: 'minimumlength',
  maxLength: 'maximumlength',
  minItems: 'minimumitems',
  maxItems: 'maximumitems',
  minimum: 'minimum',
  maximum: 'maximum',
  pattern: 'pattern',
  format: 'format',
  type: 'type',
};

function findMessage(messages: SystemJsonSchemaMessages[] | undefined, key: string): string | undefined {
  const needle = key.toLowerCase();
  for (const entry of messages ?? []) {
    for (const [candidate, text] of Object.entries(entry)) {
      if (candidate.toLowerCase() === needle && text) {
        return text;
      }
    }
  }
  return undefined;
}

function compiledValidator(schema: SystemJsonSchema): AjvValidateFunction {
  const cached = validatorCache.get(schema);
  if (cached) {
    return cached;
  }

  const compiled = ajv.compile(toJsonFormsSchema(schema));
  validatorCache.set(schema, compiled);
  return compiled;
}

function addError(errors: SystemSchemaFieldErrors, propertyId: string, message: string): void {
  const list = errors[propertyId] ?? (errors[propertyId] = []);
  if (!list.includes(message)) {
    list.push(message);
  }
}

/** `/attributes/3` -> `{ root: 'attributes', isItem: true }`. */
function splitInstancePath(instancePath: string): { root: string; isItem: boolean } {
  const segments = instancePath.split('/').filter(Boolean);
  return { root: segments[0] ?? '', isItem: segments.length > 1 && /^\d+$/.test(segments[1]) };
}

function valueAt(data: Record<string, unknown>, instancePath: string): unknown {
  return instancePath
    .split('/')
    .filter(Boolean)
    .reduce<unknown>((current, segment) => {
      if (current == null || typeof current !== 'object') {
        return undefined;
      }
      return (current as Record<string, unknown>)[segment];
    }, data);
}

/** Local calendar date (yyyy-MM-dd) — the UI checks [TODAY] against the browser's local date. */
export function localTodayIsoDate(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function dateOnly(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})$/);
  return match ? match[1] : undefined;
}

function compareDateOnly(current: string, compare: string, operator: string): boolean {
  switch (operator) {
    case '>':
      return current > compare;
    case '>=':
      return current >= compare;
    case '<':
      return current < compare;
    case '<=':
      return current <= compare;
    case '=':
    case '==':
      return current === compare;
    default:
      return false;
  }
}

function applyConstraint(
  errors: SystemSchemaFieldErrors,
  data: Record<string, unknown>,
  propertyId: string,
  property: SystemJsonSchemaProperty,
  constraint: SystemJsonSchemaConstraint,
  today: string
): void {
  if (constraint.type.toLowerCase() !== 'datecomparison' || !constraint.compareTo) {
    return;
  }

  const current = dateOnly(data[propertyId]);
  if (!current) {
    return;
  }

  const compare =
    constraint.compareTo.toUpperCase() === '[TODAY]' ? today : dateOnly(data[constraint.compareTo]);
  if (!compare) {
    return;
  }

  if (!compareDateOnly(current, compare, constraint.operator ?? '>')) {
    addError(
      errors,
      propertyId,
      findMessage(property.messages, constraint.id) ?? `${propertyId} is not valid.`
    );
  }
}

/**
 * Top-level strings are trimmed and blank strings dropped before validating, matching what is
 * submitted (blank values are omitted by `mapSystemSchemaValuesToApi`) and the API's trim-before-validate.
 */
function prepareForValidation(data: Record<string, unknown>): Record<string, unknown> {
  const prepared: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value == null) {
      continue;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        prepared[key] = trimmed;
      }
      continue;
    }
    prepared[key] = value;
  }
  return prepared;
}

/**
 * Validates form data against the API-built System schema: JSON Schema keywords via Ajv
 * plus the schema's custom `constraints` (dateComparison). Messages come from the schema's
 * `messages` entries using the same keys as the API, so client and server show the same text.
 * Blank optional formats are ignored (as the API does).
 */
export function validateSystemSchemaData(
  schema: SystemJsonSchema,
  data: Record<string, unknown>,
  today: string = localTodayIsoDate()
): SystemSchemaValidationResult {
  const prepared = prepareForValidation(data);
  const validate = compiledValidator(schema);
  validate(prepared);

  const fieldErrors: SystemSchemaFieldErrors = {};

  for (const error of validate.errors ?? []) {
    if (error.keyword === 'format') {
      const value = valueAt(prepared, error.instancePath);
      if (value == null || String(value).trim() === '') {
        continue;
      }
    }

    const messageKey = MESSAGE_KEYS[error.keyword] ?? error.keyword.toLowerCase();

    if (error.keyword === 'required') {
      const missing = String((error.params as { missingProperty?: string }).missingProperty ?? '');
      const property = schema.properties[missing];
      addError(
        fieldErrors,
        missing || '_form',
        findMessage(property?.messages, messageKey) ?? error.message ?? `${missing} field is required.`
      );
      continue;
    }

    const { root, isItem } = splitInstancePath(error.instancePath);
    const property = schema.properties[root];
    const messageSource = isItem ? property?.items : property;
    addError(
      fieldErrors,
      root || '_form',
      findMessage(messageSource?.messages, messageKey) ?? error.message ?? 'Invalid value.'
    );
  }

  for (const [propertyId, property] of Object.entries(schema.properties)) {
    for (const constraint of property.constraints ?? []) {
      applyConstraint(fieldErrors, prepared, propertyId, property, constraint, today);
    }
  }

  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

/** Merges field error maps (client + server), de-duplicating messages. */
export function mergeFieldErrors(
  ...maps: Array<SystemSchemaFieldErrors | undefined>
): SystemSchemaFieldErrors {
  const merged: SystemSchemaFieldErrors = {};
  for (const map of maps) {
    for (const [propertyId, messages] of Object.entries(map ?? {})) {
      for (const message of messages) {
        addError(merged, propertyId, message);
      }
    }
  }
  return merged;
}

/** Converts field errors to JsonForms `additionalErrors` (one entry per message, bound to the root property). */
export function toJsonFormsAdditionalErrors(fieldErrors: SystemSchemaFieldErrors): SystemSchemaErrorObject[] {
  return Object.entries(fieldErrors)
    .filter(([propertyId]) => propertyId !== '_form')
    .flatMap(([propertyId, messages]) =>
      messages.map(
        (message): SystemSchemaErrorObject => ({
          instancePath: `/${propertyId}`,
          dataPath: `.${propertyId}`,
          schemaPath: `#/properties/${propertyId}`,
          keyword: 'system',
          params: {},
          message,
        })
      )
    );
}
