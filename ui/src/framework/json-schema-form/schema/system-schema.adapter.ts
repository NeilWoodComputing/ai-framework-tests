import { JsonSchema7 } from '@jsonforms/core';
import {
  SystemJsonSchema,
  SystemJsonSchemaConditionalRequiredRule,
  SystemJsonSchemaProperty,
} from '../models/system-json-schema.model';
import { formatDateForApiDateOnly } from '../utils/date-utils';

function mapProperty(property: SystemJsonSchemaProperty): JsonSchema7 {
  const schema: JsonSchema7 = {
    type: property.type,
    title: property.title,
  };

  if (property.maxLength != null) {
    schema.maxLength = property.maxLength;
  }
  if (property.minLength != null) {
    schema.minLength = property.minLength;
  }
  if (property.minimum != null) {
    schema.minimum = property.minimum;
  }
  if (property.maximum != null) {
    schema.maximum = property.maximum;
  }
  if (property.maxItems != null) {
    schema.maxItems = property.maxItems;
  }
  if (property.default !== undefined) {
    schema.default = property.default;
  }
  if (property.format) {
    schema.format = property.format;
  }
  if (property.pattern) {
    schema.pattern = property.pattern;
  }
  if (property.allowEmptySelect) {
    (schema as JsonSchema7 & { allowEmptySelect?: boolean }).allowEmptySelect = true;
  }
  if (property.dataLookup) {
    (schema as JsonSchema7 & { dataLookup?: string }).dataLookup = property.dataLookup;
  }
  if (property.fileUpload) {
    (schema as JsonSchema7 & { fileUpload?: typeof property.fileUpload }).fileUpload = property.fileUpload;
  }
  if (Array.isArray(property.oneOf) && property.oneOf.length > 0) {
    schema.oneOf = property.oneOf.map((option) => ({
      const: option.const,
      title: option.title,
      ...(option.description ? { description: option.description } : {}),
      ...(option.icon ? { icon: option.icon } : {}),
      ...(option.children?.length
        ? {
            children: option.children.map((child) => ({
              const: child.const,
              title: child.title,
            })),
          }
        : {}),
    }));
  }
  if (property.dependentLookup) {
    (schema as JsonSchema7 & { dependentLookup?: typeof property.dependentLookup }).dependentLookup =
      property.dependentLookup;
  }
  if (property.messages?.length) {
    (schema as JsonSchema7 & { messages?: unknown }).messages = property.messages;
  }
  if (property.type === 'array' && property.items) {
    const items = Array.isArray(property.items) ? property.items[0] : property.items;
    if (items) {
      schema.items = mapProperty(items);
    }
  }
  if (property.type === 'object' && property.properties) {
    schema.properties = Object.fromEntries(
      Object.entries(property.properties).map(([key, childProperty]) => [key, mapProperty(childProperty)])
    );
    if (property.required?.length) {
      schema.required = [...property.required];
    }
    if (property.conditionalRequired?.length) {
      (
        schema as JsonSchema7 & {
          conditionalRequired?: SystemJsonSchemaConditionalRequiredRule[];
        }
      ).conditionalRequired = property.conditionalRequired;
    }
  }

  return schema;
}

/**
 * Converts a System API schema document into a JsonForms-compatible JSON Schema.
 */
export function toJsonFormsSchema(systemSchema: SystemJsonSchema): JsonSchema7 {
  const properties = Object.fromEntries(
    Object.entries(systemSchema.properties ?? {}).map(([key, property]) => [key, mapProperty(property)])
  );

  return {
    type: 'object',
    title: systemSchema.title,
    properties,
    required: systemSchema.required?.length ? [...systemSchema.required] : undefined,
  };
}

/** Default control value for a single System schema property. */
export function defaultValueForSystemProperty(property: SystemJsonSchemaProperty, isRequired: boolean): unknown {
  if (property.default !== undefined && property.type !== 'object') {
    return property.default;
  }
  if (property.type === 'object' && property.properties) {
    if (!isRequired) {
      return undefined;
    }

    const nested = buildDefaultObjectProperties(property.properties, new Set());
    return Object.keys(nested).length > 0 ? nested : undefined;
  }
  if (property.type === 'array') {
    return [];
  }
  if (property.type === 'integer' || property.type === 'number') {
    return isRequired ? null : undefined;
  }
  if (property.type === 'boolean') {
    return false;
  }
  if (property.type === 'string' && property.format === 'date') {
    return undefined;
  }
  return '';
}

function buildDefaultObjectProperties(
  properties: Record<string, SystemJsonSchemaProperty>,
  requiredKeys: Set<string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, property] of Object.entries(properties)) {
    const value = defaultValueForSystemProperty(property, requiredKeys.has(key));
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Builds initial JsonForms data from a System schema.
 * Optional number/object fields are omitted rather than set to null so they do not fail validation.
 */
export function defaultDataForSystemSchema(systemSchema: SystemJsonSchema): Record<string, unknown> {
  const requiredKeys = new Set(systemSchema.required ?? []);
  const data: Record<string, unknown> = {};

  for (const [key, property] of Object.entries(systemSchema.properties ?? {})) {
    const value = defaultValueForSystemProperty(property, requiredKeys.has(key));
    if (value !== undefined) {
      data[key] = value;
    }
  }

  return data;
}

/**
 * Sanitized initial data for reactive forms and JsonForms.
 */
export function initialFormDataForSystemSchema(systemSchema: SystemJsonSchema): Record<string, unknown> {
  return sanitizeFormData(defaultDataForSystemSchema(systemSchema));
}

/**
 * Removes null/undefined values and empty nested objects from form data so optional fields
 * do not keep the form invalid after JsonForms initialises control paths.
 */
export function sanitizeFormData(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value == null) {
      continue;
    }

    if (Array.isArray(value)) {
      result[key] = value;
      continue;
    }

    if (value instanceof Date) {
      const formatted = formatDateForApiDateOnly(value);
      if (formatted) {
        result[key] = formatted;
      }
      continue;
    }

    if (typeof value === 'object') {
      const nested = sanitizeFormData(value as Record<string, unknown>);
      if (Object.keys(nested).length > 0) {
        result[key] = nested;
      }
      continue;
    }

    result[key] = value;
  }

  return result;
}
