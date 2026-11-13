'use client';

import { type ReactNode, useLayoutEffect } from 'react';

import { Button } from '../../buttons/button/Button';
import { Modal, type ModalProps } from './Modal';
import { ModalShell } from './ModalShell';
import type { ModalLevel, ModalSize } from './modal.types';
import { clearPendingRoutedModal } from './pending-routed-modal';
import { useModalDismiss } from './use-modal-dismiss';

export interface RoutedModalProps {
  title: ReactNode;
  /** Optional sub-text shown with the title (e.g. the spec's page sub-text). */
  subtitle?: ReactNode;
  tid: string;
  dismissHref: string;
  preferBackOnClose?: boolean;
  size?: ModalSize;
  level?: ModalLevel;
  loading?: boolean;
  formErrors?: string | null;
  closeLabel?: string;
  footerRight?: ReactNode;
  children: ReactNode;
  modalProps?: Pick<ModalProps, 'allowKeyboardClose' | 'presentation'>;
}

export function RoutedModal({
  title,
  subtitle,
  tid,
  dismissHref,
  preferBackOnClose = true,
  size = 'responsive',
  level = 'primary',
  loading = false,
  formErrors,
  closeLabel = 'Close',
  footerRight,
  children,
  modalProps,
}: RoutedModalProps) {
  const close = useModalDismiss(dismissHref, preferBackOnClose);

  // Take over from the instant shell (useModalNavigate pending) in the same commit.
  useLayoutEffect(() => {
    clearPendingRoutedModal();
  }, []);
  const ariaLabel = typeof title === 'string' ? title : tid;

  return (
    <Modal open size={size} level={level} onClose={close} ariaLabel={ariaLabel} tid={tid} {...modalProps}>
      <ModalShell
        tid={tid}
        shellTid={`${tid}-shell`}
        title={title}
        subtitle={subtitle}
        onClose={close}
        loading={loading}
        formErrors={formErrors}
        footerRight={
          footerRight ?? (
            <Button theme="secondary-action" tid={`${tid}-close-button`} onClick={close}>
              {closeLabel}
            </Button>
          )
        }
      >
        {children}
      </ModalShell>
    </Modal>
  );
}
