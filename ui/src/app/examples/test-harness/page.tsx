import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ComponentTestHarness } from '@features/test-harness/ComponentTestHarness';

export const metadata: Metadata = {
  title: 'Component test harness',
  robots: { index: false, follow: false },
};

/**
 * Dev / test only component harness (Playwright component scenarios run against `next dev`).
 * Production builds (`next build` / `next start`, NODE_ENV=production) return 404 here.
 * Not linked from SiteNav or any other nav — keep it that way.
 */
export default function TestHarnessPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return <ComponentTestHarness />;
}
