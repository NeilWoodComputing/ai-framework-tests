'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  tid?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, tid, id, className, ...rest },
  ref
) {
  const inputId = id ?? tid;

  return (
    <label className={[styles.field, className ?? ''].filter(Boolean).join(' ')} htmlFor={inputId}>
      <input ref={ref} id={inputId} type="checkbox" className={styles.input} data-tid={tid} {...rest} />
      {label && <span>{label}</span>}
    </label>
  );
});
