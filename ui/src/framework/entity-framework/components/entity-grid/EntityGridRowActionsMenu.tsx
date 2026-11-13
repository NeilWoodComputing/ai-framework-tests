'use client';

import { Button, DropdownMenu } from '@design-system';

import type { AbstractIdentifiable } from '../../models/abstract-identifiable';
import type { GridRowAction } from '../../grid/grid-column';

export interface EntityGridRowActionsMenuProps<TListItem extends AbstractIdentifiable> {
  row: TListItem;
  actions: GridRowAction<TListItem>[];
  tid?: string;
  /** Called on trigger hover / focus / open (EntityGrid prefetches the actions' `prefetchHref`). */
  onIntent?: () => void;
}

/**
 * Shared row actions menu (opt in with `rowActionsDisplay: 'menu'`). `actions` are the row's
 * permitted, visible actions (filtered by `EntityGrid`); with none, no trigger is rendered.
 * Built on `DropdownMenu`, which portals the list to `<body>` so it is never clipped by the grid.
 */
export function EntityGridRowActionsMenu<TListItem extends AbstractIdentifiable>({
  row,
  actions,
  tid,
  onIntent,
}: EntityGridRowActionsMenuProps<TListItem>) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu
      tid={tid ? `${tid}-menu` : undefined}
      onTriggerIntent={onIntent}
      items={actions.map((action) => ({
        key: action.tid ?? action.label,
        label: action.label,
        icon: action.icon,
        tid: action.tid,
        onSelect: () => action.execute(row),
      }))}
      renderTrigger={(triggerProps) => (
        <Button theme="secondary-action" buttonSize="small" tid={tid} {...triggerProps}>
          Actions
        </Button>
      )}
    />
  );
}
