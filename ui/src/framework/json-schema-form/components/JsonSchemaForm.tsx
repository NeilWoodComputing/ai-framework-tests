'use client';

import { type ComponentProps, useCallback, useRef } from 'react';
import { JsonForms } from '@jsonforms/react';
import { UPDATE_CORE, type JsonSchema, type Middleware, type UISchemaElement } from '@jsonforms/core';

import type { SystemSchemaErrorObject } from '../validation/system-schema-validation';
import styles from './JsonSchemaForm.module.css';
import { systemJsonFormRenderers } from './renderers/system-json-form-renderers';

/** JsonForms types additionalErrors against the top-level Ajv package; resolve it from the component itself. */
type JsonFormsAdditionalErrors = NonNullable<ComponentProps<typeof JsonForms>['additionalErrors']>;

/**
 * Opt-in schema-driven validation: errors are produced by `validateSystemSchemaData`
 * (plus server field errors) and shown on the matching controls. JsonForms' own
 * Ajv run is switched off so messages come only from the API schema's `messages`.
 */
export interface JsonSchemaFormValidation {
  additionalErrors: SystemSchemaErrorObject[];
}

export interface JsonSchemaFormProps {
  schema: JsonSchema;
  uiSchema: UISchemaElement;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  readOnly?: boolean;
  tid?: string;
  validation?: JsonSchemaFormValidation;
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

/**
 * Keeps what the user has typed when the parent hands back older form data.
 *
 * JsonForms reports edits through a debounced `onChange` (10 ms) and re-applies the `data` prop whenever
 * `data`, the schema or `additionalErrors` change. A parent render that lands between two quick edits
 * (e.g. Name then Date Born straight after the modal opens) would pass the previous data back and wipe the
 * newer edit. Data objects this form produced (or was initialised with) are remembered; when one of those
 * comes back while the form already holds newer data, the form keeps its own. New objects from the parent
 * (record load, reset, prefill) still replace the data as before.
 */
function useKeepNewerFormData(): Middleware {
  const seen = useRef(new WeakSet<object>());
  return useCallback<Middleware>((state, action, reducer) => {
    if (
      action.type === UPDATE_CORE &&
      action.data !== state.data &&
      isObject(action.data) &&
      seen.current.has(action.data)
    ) {
      return reducer(state, { ...action, data: state.data });
    }
    const next = reducer(state, action);
    if (isObject(next.data)) seen.current.add(next.data);
    return next;
  }, []);
}

export function JsonSchemaForm({
  schema,
  uiSchema,
  data,
  onChange,
  readOnly = false,
  tid,
  validation,
}: JsonSchemaFormProps) {
  const middleware = useKeepNewerFormData();

  return (
    <div className={styles.form} data-tid={tid}>
      <JsonForms
        schema={schema}
        uischema={uiSchema}
        data={data}
        renderers={systemJsonFormRenderers}
        readonly={readOnly}
        config={{ readOnly }}
        middleware={middleware}
        {...(validation
          ? {
              validationMode: 'NoValidation' as const,
              additionalErrors: validation.additionalErrors as JsonFormsAdditionalErrors,
            }
          : {})}
        onChange={({ data: nextData }) => {
          if (nextData && typeof nextData === 'object') {
            onChange(nextData as Record<string, unknown>);
          }
        }}
      />
    </div>
  );
}
