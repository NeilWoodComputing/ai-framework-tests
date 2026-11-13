'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '../../buttons/button/Button';
import { Modal } from './Modal';
import { ModalShell } from './ModalShell';
import { clearPendingRoutedModal, usePendingRoutedModal } from './pending-routed-modal';

/**
 * Mount once (root layout). When `useModalNavigate().open(href, pending)` runs, this paints the
 * modal shell + Unity company loader on the same click, before Next.js has the intercepted route
 * (dev compile, RSC payload, client chunk). The real `RoutedModal` clears it on mount, so the
 * hand-over is a single commit with no flash.
 *
 * Do not clear just because the pathname moved to the modal's own href: the URL often changes before the
 * form route has painted, and clearing then would leave a gap with no modal. Cancel / Esc, or
 * `RoutedModal`'s mount, clear it. Browser Back / Forward (popstate), or the pathname moving anywhere other
 * than the page it opened from or the modal's href, also clear it so no orphaned shell is left behind.
 */
export function PendingRoutedModalHost() {
  const pending = usePendingRoutedModal();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pending) return;
    const onPopState = () => clearPendingRoutedModal();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [pending]);

  useEffect(() => {
    if (!pending) return;
    const targetPathname = pending.href.split(/[?#]/)[0];
    if (pathname !== pending.fromPathname && pathname !== targetPathname) clearPendingRoutedModal();
  }, [pathname, pending]);

  if (!pending) return null;

  const tid = `${pending.tid ?? 'routed-modal'}-pending`;
  const fromPathname = pending.fromPathname;
  const cancel = () => {
    clearPendingRoutedModal();
    // Prefer replace to the list we opened from. If the intercept already landed, back is safer.
    if (pathname === fromPathname) {
      router.replace(fromPathname, { scroll: false });
    } else {
      router.back();
    }
  };

  return (
    <Modal
      open
      size={pending.size ?? 'responsive'}
      level={pending.level ?? 'primary'}
      onClose={cancel}
      ariaLabel={pending.title ?? 'Loading'}
      tid={tid}
    >
      <ModalShell
        tid={tid}
        shellTid={`${tid}-shell`}
        title={pending.title}
        onClose={cancel}
        loading
        footerRight={
          <Button theme="secondary-action" tid={`${tid}-close-button`} onClick={cancel}>
            {pending.closeLabel ?? 'Cancel'}
          </Button>
        }
      >
        {null}
      </ModalShell>
    </Modal>
  );
}
