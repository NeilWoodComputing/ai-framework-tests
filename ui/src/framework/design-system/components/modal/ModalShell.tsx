'use client';

import type { ReactNode } from 'react';

import { CompanyLoader } from '../loader/CompanyLoader';
import styles from './ModalShell.module.css';

export interface ModalShellProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  onClose?: () => void;
  displayHeader?: boolean;
  displayFooter?: boolean;
  /** Shows the Unity company loader over the body (children stay mounted so their effects run). */
  loading?: boolean;
  formErrors?: string | null;
  footer?: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  bodyHeader?: ReactNode;
  bodyFooter?: ReactNode;
  children: ReactNode;
  /** Prefix for the shell's part tids (`-header`, `-close`, `-body`, `-loading`, `-footer`). */
  tid?: string;
  /** data-tid of the shell root; defaults to `tid`. Inside a `Modal` with the same tid pass `${tid}-shell` so the tid stays unique. */
  shellTid?: string;
  compactHeader?: boolean;
}

export function ModalShell({
  title,
  subtitle,
  onClose,
  displayHeader = true,
  displayFooter = true,
  loading = false,
  formErrors,
  footer,
  footerLeft,
  footerRight,
  bodyHeader,
  bodyFooter,
  children,
  tid,
  shellTid,
  compactHeader = false,
}: ModalShellProps) {
  const showFooter = displayFooter && (footer || footerLeft || footerRight);

  return (
    <div className={styles.shell} data-tid={shellTid ?? tid}>
      {displayHeader ? (
        <header
          className={[styles.header, compactHeader ? styles.headerSmall : ''].filter(Boolean).join(' ')}
          data-tid={tid ? `${tid}-header` : undefined}
        >
          {(title || subtitle) && (
            <div className={styles.headerText}>
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
              {title ? (
                <h2 className={[styles.title, subtitle ? styles.titleWithSubtitle : ''].filter(Boolean).join(' ')}>
                  {title}
                </h2>
              ) : null}
            </div>
          )}
          {onClose ? (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
              data-tid={tid ? `${tid}-close` : 'close-modal-icon'}
            >
              ×
            </button>
          ) : null}
        </header>
      ) : null}

      {bodyHeader ? <div className={styles.bodyHeader}>{bodyHeader}</div> : null}

      <div
        className={[styles.body, loading ? styles.bodyLoading : ''].filter(Boolean).join(' ')}
        data-tid={tid ? `${tid}-body` : undefined}
      >
        {/* Keep children mounted while loading so data hooks/effects can run. */}
        <div className={loading ? styles.contentHiddenWhileLoading : undefined} aria-hidden={loading}>
          {children}
        </div>
        {loading ? (
          // Unity form-modal pattern: company loader over the body while schema / record load.
          <div className={styles.loadingOverlay} data-tid={tid ? `${tid}-loading` : undefined}>
            <CompanyLoader />
          </div>
        ) : null}
        {!loading && formErrors ? <p className={styles.formErrors}>{formErrors}</p> : null}
      </div>

      {bodyFooter ? <div className={styles.bodyFooter}>{bodyFooter}</div> : null}

      {showFooter ? (
        <footer className={styles.footer} data-tid={tid ? `${tid}-footer` : undefined}>
          {footer ? <div className={styles.footerFull}>{footer}</div> : null}
          {footerLeft ? <div className={styles.footerLeft}>{footerLeft}</div> : null}
          {footerRight ? <div className={styles.footerRight}>{footerRight}</div> : null}
        </footer>
      ) : null}
    </div>
  );
}
