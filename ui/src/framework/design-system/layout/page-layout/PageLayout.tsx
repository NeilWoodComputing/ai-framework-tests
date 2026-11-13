import type { ReactNode } from 'react';
import styles from './PageLayout.module.css';

export interface PageLayoutProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Test id, written as data-tid. Defaults to `page-layout` (the layout shell). */
  tid?: string;
}

export function PageLayout({ header, children, footer, tid = 'page-layout' }: PageLayoutProps) {
  return (
    <div className={styles.layout} data-tid={tid}>
      {header && (
        <header className={styles.header}>
          <div className={styles.inner}>{header}</div>
          <hr className={styles.divider} />
        </header>
      )}
      <main className={styles.main}>
        <div className={styles.inner}>{children}</div>
      </main>
      {footer && (
        <footer className={styles.header}>
          <div className={styles.inner}>{footer}</div>
        </footer>
      )}
    </div>
  );
}
