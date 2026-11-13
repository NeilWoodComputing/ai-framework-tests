import type { ReactNode } from 'react';
import styles from './Typography.module.css';

export function H1({ children }: { children: ReactNode }) {
  return <h1 className={styles.h1}>{children}</h1>;
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className={styles.h2}>{children}</h2>;
}

export function H3({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'section';
}) {
  return (
    <h3 className={variant === 'section' ? styles.h3Section : styles.h3}>{children}</h3>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className={styles.p}>{children}</p>;
}
