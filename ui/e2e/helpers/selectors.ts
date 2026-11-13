import type { Locator, Page } from '@playwright/test';

/** Next.js renders data-tid="{value}". */
export function el(page: Page, tid: string): Locator {
  return page.locator(`[data-tid="${tid}"]`);
}

export function getInputInEl(page: Page, tid: string): Locator {
  return el(page, tid).locator('input');
}

export function getEditableInEl(page: Page, tid: string): Locator {
  return el(page, tid).locator('input, textarea');
}

export function getButton(page: Page, tid: string): Locator {
  return el(page, tid);
}
