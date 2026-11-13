'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './Switch.module.css';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  tid?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, tid, id, className, checked, disabled, readOnly, ...rest },
  ref
) {
  const inputId = id ?? tid;
  const on = checked === true;

  return (
    <label
      className={[styles.field, disabled || readOnly ? styles.fieldDisabled : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
      htmlFor={inputId}
    >
      <span className={[styles.track, on ? styles.trackOn : ''].filter(Boolean).join(' ')} aria-hidden>
        <span className={styles.thumb} />
      </span>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        role="switch"
        className={styles.input}
        data-tid={tid}
        checked={on}
        disabled={disabled || readOnly}
        readOnly={readOnly}
        {...rest}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
});
