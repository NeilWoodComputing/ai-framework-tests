import type { ReactNode } from 'react';

import type { AbstractIdentifiable } from '../models/abstract-identifiable';

export interface GridColumn<TListItem extends AbstractIdentifiable> {
  propertyName: keyof TListItem & string;
  headerLabel: string;
  sortable?: boolean;
  renderCell?: (item: TListItem) => ReactNode;
}

export interface GridRowAction<TListItem extends AbstractIdentifiable> {
  label: string;
  tid?: string;
  /** Optional icon shown before the label (e.g. in the row actions menu). */
  icon?: ReactNode;
  execute: (item: TListItem) => void;
  /** Optional modal/page href to prefetch before the user clicks. */
  prefetchHref?: (item: TListItem) => string;
  /**
   * Permissions that allow this action; it is shown when the session has ANY of them.
   * Omitted or empty = no permission needed. Unpermitted actions are hidden, not disabled.
   */
  requiredPermissions?: readonly string[];
  /** Optional per-row rule; return false to hide the action for that row. */
  isVisible?: (item: TListItem) => boolean;
}
