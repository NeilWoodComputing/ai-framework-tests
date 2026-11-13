import type { AbstractIdentifiable } from '../models/abstract-identifiable';

import type { GridRowAction } from './grid-column';

/** Default page-size choices — matches Angular `defaultPagingOptions`. */
export const defaultPagingOptions = [5, 10, 20, 50, 100, 200] as const;

export interface EntityGridConfig<TListItem extends AbstractIdentifiable = AbstractIdentifiable> {
  tid: string;
  defaultSortColumn?: string;
  pageSize?: number;
  /** When true (default), show items-per-page + range + arrow pagination. */
  hasPaging?: boolean;
  pageSizeOptions?: readonly number[];
  /**
   * Row actions, shown in an "Actions" column after every data column. Actions are filtered by
   * `requiredPermissions` (any-of, against the signed-in session) and per row by `isVisible`;
   * the column is omitted when no action is permitted for the current user.
   */
  rowActions?: GridRowAction<TListItem>[];
  /**
   * `buttons` (default) renders each permitted row action as a text button; `menu` renders the
   * shared row actions menu (`EntityGridRowActionsMenu`): an "Actions" trigger per row opening a
   * menu of the row's visible actions (icon + label), closed by Escape, an outside click or a choice.
   */
  rowActionsDisplay?: 'buttons' | 'menu';
  headerToolbarActions?: Array<{
    label: string;
    tid?: string;
    execute: () => void;
  }>;
}
