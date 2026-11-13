'use client';

import type { ReactNode } from 'react';

import { RoutedModal, type RoutedModalProps } from './RoutedModal';

export type RoutedModalLoadingFallbackProps = Pick<
  RoutedModalProps,
  'title' | 'tid' | 'dismissHref' | 'size' | 'level' | 'preferBackOnClose' | 'closeLabel'
> & {
  children?: ReactNode;
};

/**
 * Instant modal shell for Next.js `loading.tsx` (and any pre-content wait).
 * Mirrors Unity form-modal: open the dialog immediately, show the company loader in the body.
 * Pass the target modal's `tid`; the fallback dialog renders as `${tid}-fallback`, so `tid` itself only
 * ever matches the real modal (tests can wait for the form, not the fallback).
 */
export function RoutedModalLoadingFallback({
  title,
  tid,
  dismissHref,
  preferBackOnClose = true,
  size = 'large',
  level = 'primary',
  closeLabel = 'Cancel',
  children = null,
}: RoutedModalLoadingFallbackProps) {
  return (
    <RoutedModal
      title={title}
      tid={`${tid}-fallback`}
      dismissHref={dismissHref}
      preferBackOnClose={preferBackOnClose}
      size={size}
      level={level}
      loading
      closeLabel={closeLabel}
    >
      {children}
    </RoutedModal>
  );
}
