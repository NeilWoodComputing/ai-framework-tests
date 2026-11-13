import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PendingRoutedModalHost } from './PendingRoutedModalHost';
import { clearPendingRoutedModal, showPendingRoutedModal } from './pending-routed-modal';

const navigation = vi.hoisted(() => ({ pathname: '/examples/animals' }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ back: vi.fn(), replace: vi.fn(), push: vi.fn() }),
}));

function openPending() {
  act(() =>
    showPendingRoutedModal({
      href: '/examples/animals/manage/item',
      fromPathname: '/examples/animals',
      title: 'Add Animal',
      tid: 'animal-form-modal',
    })
  );
}

describe('PendingRoutedModalHost (F-38)', () => {
  afterEach(() => {
    act(() => clearPendingRoutedModal());
    cleanup();
    navigation.pathname = '/examples/animals';
  });

  it('clears the pending shell on browser Back / Forward', () => {
    render(<PendingRoutedModalHost />);
    openPending();
    expect(screen.getByTestId('animal-form-modal-pending')).toBeTruthy();

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.queryByTestId('animal-form-modal-pending')).toBeNull();
  });

  it('stays open while the URL moves to the modal href, and clears when it leaves both pages', () => {
    const { rerender } = render(<PendingRoutedModalHost />);
    openPending();

    navigation.pathname = '/examples/animals/manage/item';
    rerender(<PendingRoutedModalHost />);
    expect(screen.getByTestId('animal-form-modal-pending')).toBeTruthy();

    navigation.pathname = '/';
    rerender(<PendingRoutedModalHost />);
    expect(screen.queryByTestId('animal-form-modal-pending')).toBeNull();
  });

  it('renders one element per tid (dialog panel; the shell is -shell)', () => {
    render(<PendingRoutedModalHost />);
    openPending();
    expect(screen.getAllByTestId('animal-form-modal-pending')).toHaveLength(1);
    expect(screen.getAllByTestId('animal-form-modal-pending-shell')).toHaveLength(1);
  });
});
