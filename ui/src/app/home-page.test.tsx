import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@design-system';
import HomePage from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Home page (T-SETUP-002 / S2)', () => {
  it('renders the layout shell with the Fish nav entry', () => {
    render(
      <ThemeProvider>
        <HomePage />
      </ThemeProvider>
    );

    expect(screen.getByTestId('page-layout')).toBeTruthy();
    expect(screen.getByTestId('site-nav')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Fish', level: 1 })).toBeTruthy();
    const fishLink = screen.getByRole('link', { name: 'Fish' });
    expect(fishLink.getAttribute('href')).toBe('/fish');
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink.getAttribute('href')).toBe('/');
  });
});
