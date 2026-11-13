'use client';

import { useSyncExternalStore } from 'react';

import type { ModalLevel, ModalSize } from './modal.types';

/** What the instant shell shows while a URL-driven modal's route is still on its way. */
export interface PendingRoutedModalOptions {
  title?: string;
  tid?: string;
  size?: ModalSize;
  level?: ModalLevel;
  closeLabel?: string;
}

export interface PendingRoutedModal extends PendingRoutedModalOptions {
  href: string;
  /** Path the modal was opened from; Cancel on the pending shell returns here. */
  fromPathname: string;
}

let pending: PendingRoutedModal | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function showPendingRoutedModal(next: PendingRoutedModal): void {
  pending = next;
  emit();
}

/** Called when the real routed modal mounts (or the route changes) so the instant shell steps aside. */
export function clearPendingRoutedModal(): void {
  if (!pending) return;
  pending = null;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePendingRoutedModal(): PendingRoutedModal | null {
  return useSyncExternalStore(
    subscribe,
    () => pending,
    () => null
  );
}
