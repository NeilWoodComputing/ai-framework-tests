'use client';

import { Button, type ButtonTheme } from '../../buttons/button/Button';
import { Modal } from './Modal';
import type { ModalLevel } from './modal.types';
import styles from './ConfirmModal.module.css';

export interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  refuteText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  level?: ModalLevel;
  /** Confirm button theme; use `system-red` for destructive actions. */
  confirmTheme?: ButtonTheme;
  /** Shows the confirm button's loading state and disables both buttons (e.g. while a delete is in flight). */
  loading?: boolean;
  tid?: string;
}

/** Programmatic confirm dialog — mirrors Unity OnScreenMessagingService.confirm. */
export function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Yes',
  refuteText = 'No',
  onConfirm,
  onCancel,
  level = 'primary',
  confirmTheme = 'primary-action',
  loading = false,
  tid = 'confirmation-dialog',
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="small"
      level={level}
      ariaLabel={title ? `${title}. ${message}` : message}
      tid={tid}
    >
      <div className={styles.content}>
        {title ? <h2 className={styles.title}>{title}</h2> : null}
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <Button theme="secondary-action" onClick={onCancel} disabled={loading} tid="no-button">
            {refuteText}
          </Button>
          <div className={styles.actionsRight}>
            <Button theme={confirmTheme} onClick={onConfirm} loading={loading} tid="yes-button" autoFocus>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
