'use client';

import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonTheme =
  | 'primary-action'
  | 'secondary-action'
  | 'system-red'
  | 'system-green'
  | 'alternate';

export type ButtonSize = 'default' | 'small';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  theme?: ButtonTheme;
  loading?: boolean;
  circle?: boolean;
  buttonSize?: ButtonSize;
  fullWidth?: boolean;
  tid?: string;
  children?: ReactNode;
}

const themeClass: Record<ButtonTheme, string> = {
  'primary-action': styles.primaryAction,
  'secondary-action': styles.secondaryAction,
  'system-red': styles.systemRed,
  'system-green': styles.systemGreen,
  alternate: styles.alternate,
};

export function Button({
  theme = 'primary-action',
  loading = false,
  circle = false,
  buttonSize = 'default',
  fullWidth = false,
  disabled,
  tid,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    themeClass[theme],
    buttonSize === 'small' ? styles.small : '',
    fullWidth ? styles.fullWidth : '',
    circle ? styles.circle : '',
    circle && buttonSize === 'small' ? styles.circleSmall : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      data-tid={tid}
      {...rest}
    >
      {loading && (
        <span className={styles.loadingOverlay} aria-hidden="true">
          <span className={styles.spinner} />
        </span>
      )}
      {children}
    </button>
  );
}
