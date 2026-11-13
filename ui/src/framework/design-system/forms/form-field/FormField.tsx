'use client';

import type { ReactNode } from 'react';

import inputStyles from '../input/Input.module.css';

export interface FormFieldProps {
  children: ReactNode;
  tid?: string;
}

export function FormField({ children, tid }: FormFieldProps) {
  return (
    <div className={inputStyles.field} data-tid={tid ? `${tid}-field` : undefined}>
      {children}
    </div>
  );
}

export interface FormFieldLabelProps {
  htmlFor?: string;
  children: ReactNode;
  requiredField?: boolean;
}

export function FormFieldLabel({ htmlFor, children, requiredField = false }: FormFieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={[inputStyles.label, requiredField ? inputStyles.required : ''].filter(Boolean).join(' ')}
    >
      {children}
    </label>
  );
}

export function FormFieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <span className={inputStyles.error}>{error}</span>;
}
