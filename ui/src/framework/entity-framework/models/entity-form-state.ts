import type { AbstractIdentifiable } from './abstract-identifiable';

export type EditMode = 'Creating' | 'Updating';

export interface EntityFormState<TEntity extends AbstractIdentifiable> {
  editing: boolean;
  entity?: TEntity;
  entitySnapshot?: TEntity;
  serverValidationErrors?: Record<string, string[] | string>;
  inFlight: boolean;
  isDirty: boolean;
}

export function getEditMode(entity?: AbstractIdentifiable): EditMode {
  return entity?.id ? 'Updating' : 'Creating';
}
