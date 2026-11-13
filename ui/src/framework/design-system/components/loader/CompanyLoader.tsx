import styles from './CompanyLoader.module.css';

export interface CompanyLoaderProps {
  /** Screen-reader text announced while loading. */
  label?: string;
  /** `contained` fills its parent (modal body, panel); `inline` is a smaller ring for tight spaces. */
  size?: 'contained' | 'inline';
  tid?: string;
}

/**
 * Unity UI company loader (port of the Angular `app-company-loader`): a primary-action ring that
 * half-turns, pulsing instead under reduced motion. Use it for content that is loading (form
 * schemas, records); buttons keep their own in-flight spinner.
 */
export function CompanyLoader({ label = 'Loading', size = 'contained', tid }: CompanyLoaderProps) {
  return (
    <div
      className={[styles.loader, size === 'inline' ? styles.inline : ''].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      data-tid={tid}
    >
      <span className={styles.srOnly}>{label}</span>
      <span className={styles.spinner} aria-hidden="true" />
    </div>
  );
}
