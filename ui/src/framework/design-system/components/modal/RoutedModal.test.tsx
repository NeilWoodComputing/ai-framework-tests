import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RoutedModal } from './RoutedModal';
import { RoutedModalLoadingFallback } from './RoutedModalLoadingFallback';

vi.mock('next/navigation', () => ({
  usePathname: () => '/examples/animals/manage/item',
  useRouter: () => ({ back: vi.fn(), replace: vi.fn(), push: vi.fn() }),
}));

describe('RoutedModal tids (Test Bot note: one element per tid)', () => {
  afterEach(cleanup);

  it('puts tid on the dialog panel only; the shell is `${tid}-shell`', () => {
    render(
      <RoutedModal tid="animal-form-modal" title="Add Animal" dismissHref="/examples/animals">
        body
      </RoutedModal>
    );
    const panels = screen.getAllByTestId('animal-form-modal');
    expect(panels).toHaveLength(1);
    expect(panels[0].getAttribute('role')).toBe('dialog');
    expect(screen.getAllByTestId('animal-form-modal-shell')).toHaveLength(1);
  });

  it('renders the loading.tsx fallback as `${tid}-fallback`, never as tid', () => {
    render(<RoutedModalLoadingFallback tid="animal-form-modal" title="Add Animal" dismissHref="/examples/animals" />);
    expect(screen.queryAllByTestId('animal-form-modal')).toHaveLength(0);
    expect(screen.getAllByTestId('animal-form-modal-fallback')).toHaveLength(1);
    expect(screen.getAllByTestId('animal-form-modal-fallback-loading')).toHaveLength(1);
  });
});
