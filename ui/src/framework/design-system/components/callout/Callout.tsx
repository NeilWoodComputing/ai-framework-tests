import type { ReactNode } from 'react';
import styles from './Callout.module.css';

export type CalloutType = 'info' | 'success' | 'warning' | 'error';

const typeClass: Record<CalloutType, string> = {
  info: styles.info,
  success: styles.success,
  warning: styles.warning,
  error: styles.error,
};

export function Callout({ type, children }: { type: CalloutType; children: ReactNode }) {
  return <div className={[styles.callout, typeClass[type]].join(' ')}>{children}</div>;
}
