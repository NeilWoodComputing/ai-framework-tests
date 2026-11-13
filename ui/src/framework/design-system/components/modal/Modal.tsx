'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import type { ModalLevel, ModalPresentation, ModalSize } from './modal.types';
import styles from './Modal.module.css';

const sizeClass: Record<ModalSize, string> = {
  responsive: '',
  small: styles.sizeSmall,
  large: styles.sizeLarge,
  extraLarge: styles.sizeExtraLarge,
};

const levelClass: Record<ModalLevel, string> = {
  primary: '',
  secondary: styles.levelSecondary,
  tertiary: styles.levelTertiary,
};

/**
 * Open modals in the order they opened. Escape only closes the top-most one, so a confirm or
 * form opened over another modal doesn't dismiss the modal underneath with the same key press.
 */
const openModalStack: symbol[] = [];
const handledEscapes = new WeakSet<KeyboardEvent>();

/**
 * Body scroll lock shared by every open modal. A per-modal save/restore breaks when modals overlap
 * (stacked confirm, or the pending shell handing over to the real routed modal): the first to close
 * would unlock the page under the other, or the last would restore a stale "hidden".
 */
let scrollLockCount = 0;
let overflowBeforeLock = '';

function lockBodyScroll() {
  if (scrollLockCount === 0) {
    overflowBeforeLock = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  scrollLockCount += 1;
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = overflowBeforeLock;
  }
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
  presentation?: ModalPresentation;
  level?: ModalLevel;
  /** When false, Escape and backdrop click do not close (Angular form-modal default). */
  allowKeyboardClose?: boolean;
  tid?: string;
  /** Accessible name when the dialog has no visible title element. */
  ariaLabel?: string;
}

export function Modal({
  open,
  onClose,
  children,
  size = 'responsive',
  presentation = 'dialog',
  level = 'primary',
  allowKeyboardClose = true,
  tid,
  ariaLabel,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const stackIdRef = useRef<symbol | null>(null);

  useEffect(() => {
    if (!open) return;

    const stackId = Symbol('modal');
    stackIdRef.current = stackId;
    openModalStack.push(stackId);

    lockBodyScroll();
    panelRef.current?.focus();

    return () => {
      const index = openModalStack.lastIndexOf(stackId);
      if (index >= 0) openModalStack.splice(index, 1);
      stackIdRef.current = null;
      unlockBodyScroll();
    };
  }, [open]);

  useEffect(() => {
    if (!open || !allowKeyboardClose) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || handledEscapes.has(event)) return;
      if (openModalStack[openModalStack.length - 1] !== stackIdRef.current) return;
      handledEscapes.add(event);
      onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [allowKeyboardClose, onClose, open]);

  if (!open || typeof document === 'undefined') return null;

  const panelClasses = [
    styles.panel,
    sizeClass[size],
    presentation === 'blade' ? styles.presentationBlade : '',
    levelClass[level],
  ]
    .filter(Boolean)
    .join(' ');

  const backdropClasses = [
    styles.backdrop,
    presentation === 'blade' ? styles.backdropBlade : '',
    levelClass[level],
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <div
      className={backdropClasses}
      data-tid={tid ? `${tid}-backdrop` : undefined}
      onMouseDown={(event) => {
        if (allowKeyboardClose && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={panelClasses}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        data-tid={tid}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
