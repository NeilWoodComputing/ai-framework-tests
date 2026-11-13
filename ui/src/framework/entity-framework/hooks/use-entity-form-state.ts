'use client';

import { useCallback, useRef, useState } from 'react';
import type { AbstractIdentifiable } from '../models/abstract-identifiable';
import type { EntityFormState } from '../models/entity-form-state';
import { getEditMode } from '../models/entity-form-state';
import type { AbstractEntityDataProvider } from '../providers/abstract-entity.data-provider';
import { extractValidationErrors, getErrorMessage } from '../utils/api-error.utils';

export interface UseEntityFormStateOptions<TEntity extends AbstractIdentifiable> {
  storeName: string;
  onCreate?: (entity: TEntity) => void;
  onUpdate?: (entity: TEntity) => void;
  onFetch?: (entity: TEntity) => void;
}

export interface UseEntityFormStateReturn<TEntity extends AbstractIdentifiable> {
  state: EntityFormState<TEntity>;
  initializeCreate: (spawn?: () => TEntity) => void;
  initializeEdit: (id: string) => Promise<void>;
  fetchEntity: (id?: string) => Promise<TEntity | undefined>;
  setEntity: (entity: TEntity | undefined) => void;
  setFieldValue: (patch: Partial<TEntity>) => void;
  persist: (entityOverride?: TEntity) => Promise<TEntity>;
  resetState: () => void;
  setDirty: (dirty: boolean) => void;
}

const initialState = <TEntity extends AbstractIdentifiable>(): EntityFormState<TEntity> => ({
  editing: false,
  inFlight: false,
  isDirty: false,
});

/**
 * React hook mirroring Unity's AbstractEntityStateService (create/edit forms).
 * Pair with react-hook-form in feature components; call persist() on submit.
 */
export function useEntityFormState<TEntity extends AbstractIdentifiable>(
  provider: AbstractEntityDataProvider<TEntity>,
  options: UseEntityFormStateOptions<TEntity>
): UseEntityFormStateReturn<TEntity> {
  const providerRef = useRef(provider);
  providerRef.current = provider;

  const [state, setState] = useState<EntityFormState<TEntity>>(initialState);

  const updateState = useCallback((patch: Partial<EntityFormState<TEntity>>) => {
    setState((current) => ({ ...current, ...patch }));
  }, []);

  const resetState = useCallback(() => {
    providerRef.current.setParentPath('');
    setState(initialState());
  }, []);

  const setEntity = useCallback(
    (entity: TEntity | undefined) => {
      updateState({ entity, entitySnapshot: entity });
    },
    [updateState]
  );

  const setFieldValue = useCallback(
    (patch: Partial<TEntity>) => {
      setState((current) => {
        const entity = { ...(current.entity ?? ({} as TEntity)), ...patch } as TEntity;
        return { ...current, entity, isDirty: true };
      });
    },
    []
  );

  const setDirty = useCallback(
    (isDirty: boolean) => {
      updateState({ isDirty });
    },
    [updateState]
  );

  const fetchEntity = useCallback(
    async (id?: string): Promise<TEntity | undefined> => {
      if (id) providerRef.current.setParentPath(id);
      updateState({ inFlight: true, serverValidationErrors: undefined });

      try {
        const entity = await providerRef.current.read();
        updateState({
          entity,
          entitySnapshot: entity,
          inFlight: false,
          editing: !!id,
        });
        options.onFetch?.(entity);
        return entity;
      } catch (error) {
        updateState({
          inFlight: false,
          serverValidationErrors: extractValidationErrors(error),
        });
        throw error;
      }
    },
    [options, updateState]
  );

  const initializeCreate = useCallback(
    (spawn?: () => TEntity) => {
      providerRef.current.setParentPath('');
      const entity = spawn?.();
      updateState({
        editing: true,
        entity,
        entitySnapshot: entity,
        inFlight: false,
        isDirty: false,
        serverValidationErrors: undefined,
      });
    },
    [updateState]
  );

  const initializeEdit = useCallback(
    async (id: string) => {
      await fetchEntity(id);
    },
    [fetchEntity]
  );

  const persist = useCallback(
    async (entityOverride?: TEntity): Promise<TEntity> => {
      const entity = entityOverride ?? state.entity;
      if (!entity) {
        throw new Error(`${options.storeName}: cannot persist without entity`);
      }

      const mode = getEditMode(entity);
      updateState({ inFlight: true, serverValidationErrors: undefined });

      try {
        if (mode === 'Creating') {
          const created = (await providerRef.current.create(entity)) as TEntity;
          updateState({
            entity: created,
            entitySnapshot: created,
            inFlight: false,
            isDirty: false,
            editing: true,
          });
          options.onCreate?.(created);
          return created;
        }

        await providerRef.current.update(entity);
        updateState({
          entity,
          entitySnapshot: entity,
          inFlight: false,
          isDirty: false,
        });
        options.onUpdate?.(entity);
        return entity;
      } catch (error) {
        updateState({
          inFlight: false,
          serverValidationErrors: extractValidationErrors(error) ?? { _form: [getErrorMessage(error)] },
        });
        throw error;
      }
    },
    [options, state.entity, updateState]
  );

  return {
    state,
    initializeCreate,
    initializeEdit,
    fetchEntity,
    setEntity,
    setFieldValue,
    persist,
    resetState,
    setDirty,
  };
}
