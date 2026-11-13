'use client';

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import styles from './DropdownMenu.module.css';

export interface DropdownMenuItem {
  /** Stable key (falls back to `tid`). */
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  tid?: string;
  disabled?: boolean;
  onSelect: () => void;
}

/** Props to spread onto the trigger button (e.g. `<Button {...triggerProps}>`). */
export interface DropdownMenuTriggerProps {
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  'aria-controls': string | undefined;
  onClick: (event: ReactMouseEvent<HTMLElement>) => void;
}

export interface DropdownMenuProps {
  items: DropdownMenuItem[];
  renderTrigger: (triggerProps: DropdownMenuTriggerProps) => ReactNode;
  /** Horizontal alignment against the trigger. Default `end` (menu's right edge on the trigger's right edge). */
  align?: 'start' | 'end';
  /** Fires on trigger hover / focus and on open — use it to prefetch what the items open. */
  onTriggerIntent?: () => void;
  tid?: string;
}

interface MenuPosition {
  top: number;
  left: number;
}

const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 4;

/**
 * Overflow / actions menu. The list renders in a portal on `document.body` with `position: fixed`
 * and `--z-index-popover`, so it is never clipped by a table wrapper, grid card, or modal body
 * (`overflow: hidden/auto`). It flips above the trigger when there is no room below, follows
 * scroll / resize, and closes on outside click, Escape, Tab, or item select.
 */
export function DropdownMenu({ items, renderTrigger, align = 'end', onTriggerIntent, tid }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuId = useId();

  const focusTrigger = useCallback(() => {
    anchorRef.current?.querySelector<HTMLElement>('[aria-haspopup="menu"]')?.focus();
  }, []);

  const close = useCallback(
    (restoreFocus: boolean) => {
      setOpen(false);
      setPosition(null);
      if (restoreFocus) focusTrigger();
    },
    [focusTrigger]
  );

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;

    const trigger = anchor.getBoundingClientRect();
    const { offsetWidth: menuWidth, offsetHeight: menuHeight } = menu;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;

    const below = trigger.bottom + TRIGGER_GAP;
    const above = trigger.top - TRIGGER_GAP - menuHeight;
    const fitsBelow = below + menuHeight <= viewportHeight - VIEWPORT_MARGIN;
    const top = fitsBelow || above < VIEWPORT_MARGIN ? below : above;

    const preferredLeft = align === 'end' ? trigger.right - menuWidth : trigger.left;
    const left = Math.min(
      Math.max(preferredLeft, VIEWPORT_MARGIN),
      Math.max(VIEWPORT_MARGIN, viewportWidth - menuWidth - VIEWPORT_MARGIN)
    );

    setPosition((current) => (current?.top === top && current.left === left ? current : { top, left }));
  }, [align]);

  // Measure before paint so the menu never flashes at the wrong place.
  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Escape only dismisses the menu: stop it reaching the Modal listener on `window`.
      event.stopPropagation();
      close(true);
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    // Capture so scrolling inside a table wrapper / modal body also repositions.
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [close, open, updatePosition]);

  if (items.length === 0) return null;

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'Tab') {
      // Back to the trigger, then let Tab continue in normal page order.
      close(true);
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const menuItems = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []
    );
    if (menuItems.length === 0) return;
    const index = menuItems.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? menuItems.length - 1
          : event.key === 'ArrowDown'
            ? (index + 1) % menuItems.length
            : (index - 1 + menuItems.length) % menuItems.length;
    menuItems[next]?.focus();
  };

  return (
    <span
      className={styles.anchor}
      ref={anchorRef}
      onPointerEnter={onTriggerIntent}
      onFocus={onTriggerIntent}
    >
      {renderTrigger({
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? menuId : undefined,
        onClick: (event) => {
          event.stopPropagation();
          if (open) {
            close(false);
            return;
          }
          onTriggerIntent?.();
          setOpen(true);
        },
      })}
      {/* Unmeasured for one layout pass only (never painted); opacity keeps items focusable. */}
      {open
        ? createPortal(
            <ul
              ref={menuRef}
              id={menuId}
              role="menu"
              className={styles.menu}
              data-tid={tid}
              style={{ top: position?.top ?? 0, left: position?.left ?? 0, opacity: position ? 1 : 0 }}
              onKeyDown={handleMenuKeyDown}
            >
              {items.map((item) => (
                <li key={item.key} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.item}
                    data-tid={item.tid}
                    disabled={item.disabled}
                    onClick={(event) => {
                      event.stopPropagation();
                      close(false);
                      item.onSelect();
                    }}
                  >
                    {item.icon ? (
                      <span className={styles.icon} aria-hidden>
                        {item.icon}
                      </span>
                    ) : null}
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>,
            document.body
          )
        : null}
    </span>
  );
}
