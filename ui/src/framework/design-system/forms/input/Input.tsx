'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

export type InputSize = 'default' | 'small';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hideLabel?: boolean;
  requiredField?: boolean;
  hint?: string;
  error?: string;
  inputSize?: InputSize;
  tid?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hideLabel = false,
    requiredField = false,
    hint,
    error,
    inputSize = 'default',
    tid,
    id,
    className,
    ...rest
  },
  ref
) {
  const inputId = id ?? tid;

  return (
    <div className={styles.field} data-tid={tid ? `${tid}-field` : undefined}>
      {!hideLabel && label && (
        <label
          htmlFor={inputId}
          className={[styles.label, requiredField ? styles.required : ''].filter(Boolean).join(' ')}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={[
          styles.input,
          inputSize === 'small' ? styles.inputSmall : '',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={!!error}
        data-tid={tid}
        {...rest}
      />
      {error && <span className={styles.error}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  );
});
