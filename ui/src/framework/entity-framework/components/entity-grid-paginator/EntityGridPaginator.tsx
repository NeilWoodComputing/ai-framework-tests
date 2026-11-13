'use client';

import type { PageChangedEvent } from '../../grid/page-changed-event';
import { defaultPagingOptions } from '../../grid/entity-grid-config';
import { formatPaginatorRangeLabel } from './format-paginator-range';
import styles from './EntityGridPaginator.module.css';

export interface EntityGridPaginatorProps {
  pageIndex: number;
  pageSize: number;
  totalRows: number;
  pageSizeOptions?: readonly number[];
  disabled?: boolean;
  onPageChanged: (event: PageChangedEvent) => void;
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      className={styles.chevron}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
    >
      {direction === 'left' ? (
        <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor" />
      ) : (
        <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" fill="currentColor" />
      )}
    </svg>
  );
}

export function EntityGridPaginator({
  pageIndex,
  pageSize,
  totalRows,
  pageSizeOptions = defaultPagingOptions,
  disabled = false,
  onPageChanged,
}: EntityGridPaginatorProps) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const canGoBack = pageIndex > 0 && !disabled;
  const canGoForward = pageIndex < totalPages - 1 && !disabled;
  const rangeLabel = formatPaginatorRangeLabel(pageIndex, pageSize, totalRows);

  return (
    <nav className={styles.paginator} aria-label="Grid pagination" data-tid="grid-paginator">
      <div className={styles.pageSize}>
        <label className={styles.pageSizeLabel} htmlFor="grid-page-size">
          Items per page:
        </label>
        <select
          id="grid-page-size"
          className={styles.pageSizeSelect}
          value={pageSize}
          disabled={disabled}
          data-tid="grid-page-size"
          onChange={(event) =>
            onPageChanged({ pageIndex: 0, pageSize: Number(event.target.value) })
          }
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <span className={styles.range} data-tid="grid-page-range">
        {rangeLabel}
      </span>

      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navButton}
          disabled={!canGoBack}
          aria-label="Previous page"
          data-tid="grid-prev-page"
          onClick={() => onPageChanged({ pageIndex: pageIndex - 1, pageSize })}
        >
          <ChevronIcon direction="left" />
        </button>
        <button
          type="button"
          className={styles.navButton}
          disabled={!canGoForward}
          aria-label="Next page"
          data-tid="grid-next-page"
          onClick={() => onPageChanged({ pageIndex: pageIndex + 1, pageSize })}
        >
          <ChevronIcon direction="right" />
        </button>
      </div>
    </nav>
  );
}
