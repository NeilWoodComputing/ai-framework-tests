'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Icon, Switch } from '@design-system';
import styles from './grid-cell-renderers.module.css';

/** Read-only switch for a boolean grid column (On when true). */
export function renderBooleanSwitchCell(value: boolean | null | undefined, label: string, tid?: string): ReactNode {
  return <Switch checked={value === true} readOnly aria-label={label} tid={tid} />;
}

export interface BooleanIconCellOptions {
  trueLabel?: string;
  falseLabel?: string;
  nullLabel?: string;
  tid?: string;
  /** Circle diameter (default `1.6rem`); the cut-out glyph spans 75% of it. */
  size?: number | string;
}

/** Only a non-default size is passed inline (as a CSS variable); layout and colours live in the CSS module. */
const booleanSizeStyle = (diameter: number | string | undefined): CSSProperties | undefined =>
  diameter === undefined
    ? undefined
    : ({ '--boolean-cell-size': typeof diameter === 'number' ? `${diameter}px` : diameter } as CSSProperties);

/**
 * Read-only boolean cell (decision 30, glyph cut-out per Neil 2026-10-08): a filled circle with the glyph knocked out.
 * True: `--app-boolean-true-fill` circle with a transparent Material Check hole. False: `--app-boolean-false-fill`
 * circle with a transparent Material Close hole. The row / hover background shows through the glyph, so the glyph
 * reads in both themes with no glyph colour token. Rendered as one SVG path (`<Icon knockout="circle">`, evenodd).
 * Null / undefined: an em dash in the theme text colour (no circle).
 * Colours come only from theme tokens (no hard-coded hex); the accessible name is never colour-only.
 * Not interactive: no handlers, not focusable, not a switch / button / link.
 */
export function renderBooleanIconCell(
  value: boolean | null | undefined,
  options: BooleanIconCellOptions = {}
): ReactNode {
  const trueLabel = options.trueLabel ?? 'Yes';
  const falseLabel = options.falseLabel ?? 'No';
  const nullLabel = options.nullLabel ?? 'Not set';
  const size = options.size;
  const tid = options.tid;

  if (value === true || value === false) {
    const label = value ? trueLabel : falseLabel;
    return (
      <span
        role="img"
        aria-label={label}
        title={label}
        data-tid={tid}
        data-boolean-value={value ? 'true' : 'false'}
        className={`${styles.booleanCircle} ${value ? styles.booleanTrue : styles.booleanFalse}`}
        style={booleanSizeStyle(size)}
      >
        <Icon name={value ? 'Check' : 'Close'} knockout="circle" size="100%" />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={nullLabel}
      title={nullLabel}
      data-tid={tid}
      data-boolean-value="null"
      className={styles.booleanNull}
    >
      {'\u2014'}
    </span>
  );
}

/** Comma-separated string array for a grid column; an empty or missing array shows an empty cell. */
export function formatStringArrayCell(values: readonly string[] | null | undefined): string {
  return Array.isArray(values) ? values.join(', ') : '';
}

const pad = (value: number) => String(value).padStart(2, '0');

/** `yyyy-MM-dd` (date only, no time zone shift) as `DD/MM/YYYY`; empty for missing / invalid values. */
export function formatDateOnlyCell(value: string | null | undefined): string {
  const match = typeof value === 'string' ? value.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

/** UTC timestamp shown in the browser's local time as `DD/MM/YYYY HH:MM`; empty for missing / invalid values. */
export function formatLocalDateTimeCell(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
