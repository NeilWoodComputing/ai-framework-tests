/**
 * JSON Schema message entry keyed by validation rule (e.g. required, maximumlength).
 */
export type SystemJsonSchemaMessages = Record<string, string>;

/**
 * Select option defined by a schema `oneOf` entry.
 */
export interface SystemJsonSchemaOneOfOption {
  title: string;
  const: string;
  description?: string;
  icon?: string;
  /**
   * Nested selectable options (e.g. role → permissions for SelectionPillGroup).
   * Values bound to the form are the child consts, not the parent const.
   */
  children?: { title: string; const: string }[];
}

/**
 * Schema-driven file upload endpoints and constraints.
 */
export interface SystemJsonSchemaFileUpload {
  /** Upload (and replace/delete) when the user attaches a file instead of on entity save. */
  uploadOnAttach?: boolean;
  /** Omit for direct upload to uploadUrl (e.g. coverage area boundaries → Location Service). */
  createUrl?: string;
  createBody?: Record<string, unknown>;
  uploadUrl: string;
  metadataUrl?: string;
  downloadUrl?: string;
  deleteUrl?: string;
  fileFieldName?: string;
  accept?: string[];
  maxFiles?: number;
  maxFileSize?: number;
}

/**
 * Configuration for a field whose options are loaded from an API based on another field's value.
 */
export interface SystemJsonSchemaDependentLookup {
  /** Omit for a lookup whose options do not vary with another field. */
  dependsOn?: string;
  lookupPath: string;
  queryParams?: Record<string, string>;
  valueField?: string;
  labelField?: string;
  pageSize?: number;
}

/**
 * Custom constraint evaluated by the API (RecordSchemaValidator) and mirrored client-side.
 * dateComparison: compareTo is a sibling property or [TODAY]; operator is >, >=, <, <=, or =.
 */
export interface SystemJsonSchemaConstraint {
  id: string;
  type: string;
  compareTo?: string;
  operator?: string;
}

/**
 * Property definition returned by Unity schema endpoints (e.g. v2/schemas/create-project-initiation).
 */
export interface SystemJsonSchemaProperty {
  title: string;
  modelPropertyName: string;
  messages?: SystemJsonSchemaMessages[];
  type: 'string' | 'integer' | 'number' | 'array' | 'object' | 'boolean';
  format?: string;
  pattern?: string;
  maxLength?: number;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  oneOf?: SystemJsonSchemaOneOfOption[];
  dependentLookup?: SystemJsonSchemaDependentLookup;
  /** Lookup key — Reference Service on the server, or client-bound (e.g. DEVELOPMENT_PHASES). */
  dataLookup?: string;
  /** Schema-driven file upload endpoints and constraints. */
  fileUpload?: SystemJsonSchemaFileUpload;
  /** Renders a multi/single select with no options when true (avoids invalid empty oneOf). */
  allowEmptySelect?: boolean;
  items?: SystemJsonSchemaProperty;
  properties?: Record<string, SystemJsonSchemaProperty>;
  /** Minimum array length (e.g. at least one MPID configuration). */
  minItems?: number;
  /** Maximum array length (e.g. at most 20 tags). */
  maxItems?: number;
  /** Schema default used for the initial Add value (e.g. a Switch that starts Off). */
  default?: unknown;
  /** Custom server constraints (e.g. dateComparison against [TODAY]); messages are keyed by constraint id. */
  constraints?: SystemJsonSchemaConstraint[];
  /** Nested object required keys (e.g. modal list item schemas). */
  required?: string[];
  /** Nested object conditional-required rules (e.g. modal list item schemas). */
  conditionalRequired?: SystemJsonSchemaConditionalRequiredRule[];
}

/**
 * Tab section defined on a System schema via `formTabs`.
 */
export interface SystemJsonSchemaFormTab {
  title: string;
  properties: string[];
}

/**
 * Condition property match used in root `if` clauses.
 */
export interface SystemJsonSchemaIfProperty {
  const?: string;
  enum?: string[];
  /** `1` means the trigger fires on any entered value rather than a specific match. */
  minLength?: number;
}

/**
 * JSON Schema `if` clause (e.g. when Action is Cancel / one of an enum).
 */
export interface SystemJsonSchemaIfCondition {
  properties?: Record<string, SystemJsonSchemaIfProperty>;
  required?: string[];
}

/**
 * Nested property constraints applied when a `then` clause matches.
 */
export interface SystemJsonSchemaThenProperty {
  required?: boolean;
  minItems?: number;
  minLength?: number;
  maxLength?: number;
}

/**
 * JSON Schema `then` clause (e.g. mark Reason required).
 */
export interface SystemJsonSchemaThenClause {
  required?: string[];
  properties?: Record<string, SystemJsonSchemaThenProperty>;
  messages?: SystemJsonSchemaMessages[];
}

/**
 * Explicit multi-rule conditional required (e.g. Email when EMAIL, Telephone when PHONE).
 * Produced from schema `conditionalRequired` or promoted from `allOf` `if`/`then` pairs.
 */
export interface SystemJsonSchemaConditionalRequiredRule {
  when: {
    property: string;
    /** Trigger fires when the property holds one of these values. */
    values?: string[];
    /** Trigger fires when the property holds any non-blank value (e.g. Block Reference when Block Name is entered). */
    notEmpty?: boolean;
  };
  require: string[];
}

/**
 * Root schema document describing a create/edit form.
 */
export interface SystemJsonSchema {
  title: string;
  type: 'object';
  properties: Record<string, SystemJsonSchemaProperty>;
  required?: string[];
  formTabs?: SystemJsonSchemaFormTab[];
  /** Conditional required (e.g. Reason when Action matches). */
  if?: SystemJsonSchemaIfCondition;
  then?: SystemJsonSchemaThenClause;
  /** Multiple conditional-required rules (mutually exclusive preferred-contact fields, etc.). */
  conditionalRequired?: SystemJsonSchemaConditionalRequiredRule[];
}
