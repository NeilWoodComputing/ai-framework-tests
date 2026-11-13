'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, useTheme } from '@design-system';
import styles from './SiteNav.module.css';

/**
 * App chrome navigation. This test app has no sign-in (T-SETUP-002).
 * The Fish entry is ready for T-FISH-006 (#21), which adds the list page at /fish.
 */
export function SiteNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className={styles.nav} data-tid="site-nav">
      <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>
        Home
      </Link>
      <Link href="/fish" aria-current={pathname.startsWith('/fish') ? 'page' : undefined}>
        Fish
      </Link>
      <Link
        href="/design-system"
        aria-current={pathname.startsWith('/design-system') ? 'page' : undefined}
      >
        Design system
      </Link>
      <div className={styles.actions}>
        <Button theme="alternate" buttonSize="small" onClick={toggleTheme} tid="theme-toggle">
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </Button>
      </div>
    </nav>
  );
}
