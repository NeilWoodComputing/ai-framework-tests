'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Callout } from '@design-system';

export interface EntityGridAuthGateProps {
  authInFlight: boolean;
  isAuthenticated: boolean;
  signInHref?: string;
  message?: string;
  children: ReactNode;
}

export function EntityGridAuthGate({
  authInFlight,
  isAuthenticated,
  signInHref = '/auth/sign-in',
  message = 'Sign in to load grid data — requests need your JWT.',
  children,
}: EntityGridAuthGateProps) {
  if (authInFlight) {
    return <p>Checking sign-in…</p>;
  }

  if (!isAuthenticated) {
    return (
      <Callout type="warning">
        {message} <Link href={signInHref}>Go to sign in</Link>
      </Callout>
    );
  }

  return children;
}
