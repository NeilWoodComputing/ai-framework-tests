'use client';

import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@design-system';
import { useAuth } from '@auth/context/AuthProvider';
import { hasAnyPermission } from '@auth/permissions';
import type { GridRowAction } from '../../grid/grid-column';
import type { AbstractIdentifiable } from '../../models/abstract-identifiable';
import type { SearchRequest } from '../../models/search-request';
import type { EntityGridState } from '../../hooks/use-entity-grid-state';
import { EntityGridPaginator } from '../entity-grid-paginator/EntityGridPaginator';
import { EntityGridRowActionsMenu } from './EntityGridRowActionsMenu';
import styles from './EntityGrid.module.css';

export interface EntityGridProps<
  TListItem extends AbstractIdentifiable,
  TSearchRequest extends SearchRequest,
> {
  gridState: EntityGridState<TListItem, TSearchRequest>;
  headerActions?: ReactNode;
  /**
   * Permissions used to filter `rowActions`. Defaults to the signed-in session's permissions;
   * only pass this to drive the real grid from local state (e.g. the dev-only component test harness).
   */
  sessionPermissions?: readonly string[];
}

export function EntityGrid<
  TListItem extends AbstractIdentifiable,
  TSearchRequest extends SearchRequest,
>({ gridState, headerActions, sessionPermissions: sessionPermissionsOverride }: EntityGridProps<TListItem, TSearchRequest>) {
  const {
    config,
    columns,
    entities,
    totalRows,
    inFlight,
    error,
    searchRequest,
    onPageChanged,
    setSort,
  } = gridState;

  const { session } = useAuth();
  const sessionPermissions = sessionPermissionsOverride ?? session?.permissions;
  const hasPaging = config.hasPaging !== false;
  const showPaginator = hasPaging && totalRows > 0;
  // Unpermitted actions are hidden; with none permitted there is no Actions column.
  const rowActions = useMemo(
    () =>
      (config.rowActions ?? []).filter((action) =>
        hasAnyPermission(sessionPermissions, action.requiredPermissions)
      ),
    [config.rowActions, sessionPermissions]
  );
  const visibleRowActions = (row: TListItem): GridRowAction<TListItem>[] =>
    rowActions.filter((action) => !action.isVisible || action.isVisible(row));

  // Warm the route each action opens (e.g. the Edit form modal) on hover / focus, once per href.
  const router = useRouter();
  const prefetchedHrefs = useRef(new Set<string>());
  const prefetchRowActions = useCallback(
    (row: TListItem, actions: GridRowAction<TListItem>[]) => {
      for (const action of actions) {
        const href = action.prefetchHref?.(row);
        if (!href || prefetchedHrefs.current.has(href)) continue;
        prefetchedHrefs.current.add(href);
        router.prefetch(href);
      }
    },
    [router]
  );
  const headerToolbarActions = config.headerToolbarActions ?? [];
  const displayColumns =
    rowActions.length > 0
      ? [
          ...columns,
          {
            propertyName: '__actions' as keyof TListItem & string,
            headerLabel: 'Actions',
            sortable: false,
          },
        ]
      : columns;

  const handleSort = (propertyName: string, sortable?: boolean) => {
    if (!sortable) return;

    const isActive = searchRequest.sortBy === propertyName;
    const nextDirection =
      isActive && searchRequest.sortDirection === 'asc' ? 'desc' : 'asc';
    setSort(propertyName, nextDirection);
  };

  return (
    <div className={styles.grid} data-tid={config.tid}>
      {(headerActions || headerToolbarActions.length > 0 || !showPaginator) && (
        <div className={styles.toolbar}>
          {!showPaginator && (
            <span>
              {totalRows} result{totalRows === 1 ? '' : 's'}
            </span>
          )}
          {headerToolbarActions.map((action) => (
            <Button
              key={action.tid ?? action.label}
              theme="primary-action"
              buttonSize="small"
              tid={action.tid}
              onClick={action.execute}
            >
              {action.label}
            </Button>
          ))}
          {headerActions}
        </div>
      )}

      {error ? (
        <div className={styles.empty} role="alert">
          {error}
        </div>
      ) : inFlight && entities.length === 0 ? (
        <div className={styles.loading}>Loading…</div>
      ) : entities.length === 0 ? (
        <div className={styles.empty}>No results</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {displayColumns.map((column) => (
                  <th
                    key={column.propertyName}
                    className={column.sortable ? styles.sortable : undefined}
                    onClick={() => handleSort(column.propertyName, column.sortable)}
                  >
                    {column.headerLabel}
                    {searchRequest.sortBy === column.propertyName &&
                      (searchRequest.sortDirection === 'asc' ? ' ↑' : ' ↓')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entities.map((row, rowIndex) => (
                <tr key={`${String(row.id)}-${rowIndex}`}>
                  {displayColumns.map((column) => (
                    <td key={column.propertyName}>
                      {column.propertyName === '__actions' && config.rowActionsDisplay === 'menu'
                        ? (
                            <EntityGridRowActionsMenu
                              row={row}
                              actions={visibleRowActions(row)}
                              tid={`${config.tid}-row-${rowIndex}-actions`}
                              onIntent={() => prefetchRowActions(row, visibleRowActions(row))}
                            />
                          )
                        : column.propertyName === '__actions'
                        ? visibleRowActions(row).map((action) => (
                            <Button
                              key={action.tid ?? action.label}
                              theme="secondary-action"
                              buttonSize="small"
                              tid={action.tid}
                              onPointerEnter={() => prefetchRowActions(row, [action])}
                              onFocus={() => prefetchRowActions(row, [action])}
                              onClick={(event) => {
                                event.stopPropagation();
                                action.execute(row);
                              }}
                            >
                              {action.label}
                            </Button>
                          ))
                        : column.renderCell
                          ? column.renderCell(row)
                          : String(row[column.propertyName] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPaginator && (
        <div className={styles.footer}>
          <EntityGridPaginator
            pageIndex={searchRequest.pageIndex}
            pageSize={searchRequest.pageSize}
            totalRows={totalRows}
            pageSizeOptions={config.pageSizeOptions}
            disabled={inFlight}
            onPageChanged={onPageChanged}
          />
        </div>
      )}
    </div>
  );
}
