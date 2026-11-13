import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@auth/context/AuthProvider';
import { ThemeProvider } from '@design-system';
import { ComponentTestHarness } from './ComponentTestHarness';

vi.mock('next/navigation', () => ({
  usePathname: () => '/examples/test-harness',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
}));

describe('Component test harness (T-SETUP-002 / S3)', () => {
  it('runs and renders the shared component fixtures', () => {
    render(
      <ThemeProvider>
        <AuthProvider>
          <ComponentTestHarness />
        </AuthProvider>
      </ThemeProvider>
    );

    expect(screen.getByTestId('component-test-harness')).toBeTruthy();
    expect(screen.getByTestId('harness-switch-section')).toBeTruthy();
    expect(screen.getByTestId('harness-boolean-icons-section')).toBeTruthy();
    expect(screen.getByTestId('harness-actions-section')).toBeTruthy();
  });
});
