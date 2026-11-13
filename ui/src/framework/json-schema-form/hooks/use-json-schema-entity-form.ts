'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { UISchemaElement } from '@jsonforms/core';

import type { AbstractIdentifiable } from '@entity-framework/models/abstract-identifiable';
import type { AbstractEntityDataProvider } from '@entity-framework/providers/abstract-entity.data-provider';
import { ApiRequestError, extractValidationErrors, getErrorMessage } from '@entity-framework/utils/api-error.utils';

import type { SystemJsonSchema } from '../models/system-json-schema.model';
import { fetchSystemJsonSchema } from '../services/json-schema-data.service';
import { initialFormDataForSystemSchema, toJsonFormsSchema } from '../schema/system-schema.adapter';
import { mapApiValuesToSystemSchema, mapSystemSchemaValuesToApi } from '../schema/system-schema-value.mapper';
import {
  mergeFieldErrors,
  toJsonFormsAdditionalErrors,
  validateSystemSchemaData,
  type SystemSchemaErrorObject,
  type SystemSchemaFieldErrors,
} from '../validation/system-schema-validation';

export interface JsonSchemaFormVm {
  title: string;
  jsonFormsSchema: ReturnType<typeof toJsonFormsSchema>;
  uiSchema: UISchemaElement;
  error?: string;
}

export interface UseJsonSchemaEntityFormOptions<TEntity extends AbstractIdentifiable> {
  createSchemaUrl: string;
  updateSchemaUrl: string;
  buildUiSchema: (schema: SystemJsonSchema, editing: boolean) => UISchemaElement;
  provider: AbstractEntityDataProvider<TEntity>;
  onCreate?: (entity: TEntity) => void;
  onUpdate?: (entity: TEntity) => void;
  schemaLoadErrorMessage?: string;
  /**
   * When true, validate against the loaded System schema on the client (Ajv + constraints)
   * and show schema `messages`. Default false keeps existing forms (e.g. reference data) unchanged.
   */
  schemaDrivenValidation?: boolean;
  /** Send empty array properties as `[]` on save (default false keeps existing payloads unchanged). */
  submitEmptyArrays?: boolean;
}

export function useJsonSchemaEntityForm<TEntity extends AbstractIdentifiable>({
  createSchemaUrl,
  updateSchemaUrl,
  buildUiSchema,
  provider,
  onCreate,
  onUpdate,
  schemaLoadErrorMessage = 'Unable to load the form. Please try again.',
  schemaDrivenValidation = false,
  submitEmptyArrays = false,
}: UseJsonSchemaEntityFormOptions<TEntity>) {
  // Start true so the modal shell can open immediately with the Unity loader before initialize* runs.
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [inFlight, setInFlight] = useState(false);
  const [formVm, setFormVm] = useState<JsonSchemaFormVm | null>(null);
  const [formData, setFormDataState] = useState<Record<string, unknown>>({});
  const [systemSchema, setSystemSchema] = useState<SystemJsonSchema | undefined>();
  const [editingId, setEditingId] = useState<string | undefined>();
  const [readOnly, setReadOnly] = useState(false);
  const [serverValidationErrors, setServerValidationErrors] = useState<SystemSchemaFieldErrors>();
  const [showValidation, setShowValidation] = useState(false);
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set());
  const formDataRef = useRef<Record<string, unknown>>({});
  /**
   * Bumped by every initialize* and reset. A load that finishes after a newer one started (React Strict
   * Mode's mount / unmount / mount, a quick close and reopen, or a new record id) is dropped, so it can
   * never re-bind the form and wipe what the user has typed since.
   */
  const loadGeneration = useRef(0);

  const clientValidation = useMemo(() => {
    if (!schemaDrivenValidation || !systemSchema) {
      return { valid: true, fieldErrors: {} as SystemSchemaFieldErrors };
    }
    return validateSystemSchemaData(systemSchema, formData);
  }, [formData, schemaDrivenValidation, systemSchema]);

  /** Client errors show for fields the user has changed, and for every field after a save attempt. */
  const visibleClientErrors = useMemo(() => {
    if (showValidation) {
      return clientValidation.fieldErrors;
    }
    return Object.fromEntries(
      Object.entries(clientValidation.fieldErrors).filter(([propertyId]) => touched.has(propertyId))
    );
  }, [clientValidation.fieldErrors, showValidation, touched]);

  const fieldErrors = useMemo(
    () => mergeFieldErrors(visibleClientErrors, serverValidationErrors),
    [serverValidationErrors, visibleClientErrors]
  );

  const additionalErrors: SystemSchemaErrorObject[] = useMemo(
    () => toJsonFormsAdditionalErrors(fieldErrors),
    [fieldErrors]
  );

  const hasClientErrors = schemaDrivenValidation && !clientValidation.valid;

  const replaceFormData = useCallback((next: Record<string, unknown>) => {
    formDataRef.current = next;
    setFormDataState(next);
  }, []);

  const setFormData = useCallback(
    (next: Record<string, unknown>) => {
      if (schemaDrivenValidation) {
        const previous = formDataRef.current;
        const changed = Object.keys({ ...previous, ...next }).filter(
          (key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key])
        );
        if (changed.length) {
          setTouched((current) => new Set([...current, ...changed]));
          // A server message (e.g. duplicate name) clears once that field is edited.
          setServerValidationErrors((current) => {
            if (!current) return current;
            const remaining = Object.fromEntries(
              Object.entries(current).filter(([propertyId]) => !changed.includes(propertyId))
            );
            return Object.keys(remaining).length ? remaining : undefined;
          });
        }
      }
      replaceFormData(next);
    },
    [replaceFormData, schemaDrivenValidation]
  );

  const bindSchema = useCallback(
    (schema: SystemJsonSchema, data: Record<string, unknown>, entityId: string | undefined, editing: boolean) => {
      setSystemSchema(schema);
      replaceFormData(data);
      setEditingId(entityId);
      setShowValidation(false);
      setTouched(new Set());
      setFormVm({
        title: schema.title,
        jsonFormsSchema: toJsonFormsSchema(schema),
        uiSchema: buildUiSchema(schema, editing),
      });
    },
    [buildUiSchema, replaceFormData]
  );

  const reset = useCallback(() => {
    loadGeneration.current += 1;
    setFormVm(null);
    replaceFormData({});
    setSystemSchema(undefined);
    setEditingId(undefined);
    setReadOnly(false);
    setServerValidationErrors(undefined);
    setShowValidation(false);
    setTouched(new Set());
    // Stay loading so a remount / animalId change does not flash an empty body.
    setSchemaLoading(true);
    provider.setParentPath('');
  }, [provider, replaceFormData]);

  const initializeCreate = useCallback(
    async (prefill: Record<string, unknown> = {}) => {
      if (readOnly) {
        setSchemaLoading(false);
        return;
      }

      const generation = ++loadGeneration.current;
      provider.setParentPath('');
      setSchemaLoading(true);
      setServerValidationErrors(undefined);
      setShowValidation(false);

      try {
        const schema = await fetchSystemJsonSchema(createSchemaUrl);
        if (generation !== loadGeneration.current) return;
        const data = { ...initialFormDataForSystemSchema(schema), ...prefill };
        bindSchema(schema, data, undefined, false);
      } catch {
        if (generation !== loadGeneration.current) return;
        setFormVm({
          title: 'Form',
          jsonFormsSchema: { type: 'object' },
          uiSchema: { type: 'VerticalLayout', elements: [] },
          error: schemaLoadErrorMessage,
        });
      } finally {
        if (generation === loadGeneration.current) setSchemaLoading(false);
      }
    },
    [bindSchema, createSchemaUrl, provider, readOnly, schemaLoadErrorMessage]
  );

  const initializeEdit = useCallback(
    async (id: string): Promise<TEntity | undefined> => {
      const generation = ++loadGeneration.current;
      provider.setParentPath(id);
      setSchemaLoading(true);
      setServerValidationErrors(undefined);
      setShowValidation(false);

      try {
        // Schema (usually cached) and record load in parallel.
        const [schema, entity] = await Promise.all([fetchSystemJsonSchema(updateSchemaUrl), provider.read()]);
        if (generation !== loadGeneration.current) return undefined;
        bindSchema(
          schema,
          mapApiValuesToSystemSchema(schema, entity as unknown as Record<string, unknown>),
          id,
          true
        );
        return entity;
      } catch (error) {
        if (generation !== loadGeneration.current) return undefined;
        // Not found (e.g. a deleted record): show the API's message rather than "try again".
        const notFoundMessage =
          error instanceof ApiRequestError && error.status === 404
            ? getErrorMessage({ body: error.body }, 'This record could not be found. It may have been deleted.')
            : undefined;
        setFormVm({
          title: 'Form',
          jsonFormsSchema: { type: 'object' },
          uiSchema: { type: 'VerticalLayout', elements: [] },
          error: notFoundMessage ?? schemaLoadErrorMessage,
        });
        return undefined;
      } finally {
        if (generation === loadGeneration.current) setSchemaLoading(false);
      }
    },
    [bindSchema, provider, schemaLoadErrorMessage, updateSchemaUrl]
  );

  const persist = useCallback(async () => {
    if (readOnly || !systemSchema) {
      throw new Error('Form is read-only or schema is not loaded.');
    }

    if (schemaDrivenValidation) {
      setShowValidation(true);
      const latest = validateSystemSchemaData(systemSchema, formData);
      if (!latest.valid) {
        const error = new Error('Please fix the highlighted fields.');
        setServerValidationErrors(undefined);
        throw error;
      }
    }

    const payload = mapSystemSchemaValuesToApi(systemSchema, formData, { submitEmptyArrays });
    const entity = {
      ...(editingId ? { id: editingId } : {}),
      ...payload,
    } as TEntity;

    setInFlight(true);
    setServerValidationErrors(undefined);

    try {
      if (editingId) {
        await provider.update(entity);
        onUpdate?.(entity);
        return entity;
      }

      const created = (await provider.create(entity)) as TEntity;
      onCreate?.(created);
      return created;
    } catch (error) {
      setShowValidation(true);
      setServerValidationErrors(
        extractValidationErrors(error) ?? { _form: [getErrorMessage(error)] }
      );
      throw error;
    } finally {
      setInFlight(false);
    }
  }, [
    editingId,
    formData,
    onCreate,
    onUpdate,
    provider,
    readOnly,
    schemaDrivenValidation,
    submitEmptyArrays,
    systemSchema,
  ]);

  return {
    formVm,
    formData,
    setFormData,
    schemaLoading,
    inFlight,
    editingId,
    readOnly,
    setReadOnly,
    /** Field errors to display: client schema errors (when enabled) merged with server errors; undefined when none. */
    serverValidationErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined,
    clientValidationErrors: clientValidation.fieldErrors,
    hasClientErrors,
    showValidation,
    setShowValidation,
    additionalErrors,
    initializeCreate,
    initializeEdit,
    persist,
    reset,
  };
}
