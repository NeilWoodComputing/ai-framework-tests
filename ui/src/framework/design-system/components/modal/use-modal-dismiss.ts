'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Dismisses a URL-driven modal.
 * Soft navigations (intercepting parallel routes) should use history back.
 * Hard navigations (full page load) should replace to the fallback href.
 */
export function useModalDismiss(fallbackHref: string, preferBack = true) {
  const router = useRouter();

  return useCallback(() => {
    if (preferBack) {
      router.back();
      return;
    }

    router.replace(fallbackHref, { scroll: false });
  }, [router, fallbackHref, preferBack]);
}
