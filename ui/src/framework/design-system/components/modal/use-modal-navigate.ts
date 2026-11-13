'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { showPendingRoutedModal, type PendingRoutedModalOptions } from './pending-routed-modal';

/**
 * Navigation helpers for URL-driven modals (prefetch + open without scroll jump).
 * Pass `pending` to `open` (title / tid / size / level matching the target `RoutedModal`) and the
 * modal shell + Unity loader paint on the click, before the route arrives (`PendingRoutedModalHost`).
 */
export function useModalNavigate() {
  const router = useRouter();
  const pathname = usePathname();

  const prefetch = useCallback(
    (href: string) => {
      router.prefetch(href);
    },
    [router]
  );

  const open = useCallback(
    (href: string, pending?: PendingRoutedModalOptions) => {
      if (pending) {
        showPendingRoutedModal({ ...pending, href, fromPathname: pathname });
      }
      router.push(href, { scroll: false });
    },
    [pathname, router]
  );

  return useMemo(
    () => ({
      prefetch,
      open,
    }),
    [open, prefetch]
  );
}

/**
 * Warms routed modals from the page that opens them, so the first open is as fast as later ones:
 * prefetches each href (route payload + chunks; note `next dev` skips prefetch by design) and runs
 * `preload` once per mount — e.g. load `@json-schema-form` and its schema:
 *
 * ```ts
 * useModalPreload(animalFormHref(), () =>
 *   import('@json-schema-form').then((m) => m.prefetchSystemJsonSchema(apiRoutes.animals.createAnimalSchema))
 * );
 * ```
 */
export function useModalPreload(hrefs: string | readonly string[], preload?: () => unknown) {
  const router = useRouter();
  const hrefKey = typeof hrefs === 'string' ? hrefs : hrefs.join('\n');
  const preloadRef = useRef(preload);
  preloadRef.current = preload;

  useEffect(() => {
    for (const href of hrefKey.split('\n')) {
      if (href) router.prefetch(href);
    }
    // Warm-up is best effort: a failure here surfaces normally when the modal opens.
    void Promise.resolve()
      .then(() => preloadRef.current?.())
      .catch(() => undefined);
  }, [hrefKey, router]);
}
