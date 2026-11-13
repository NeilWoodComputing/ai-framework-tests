import { expect } from '@playwright/test';
import { Given, When, Then } from '../common/fixtures';
import { getBaseUrl } from '../../helpers/config';

Given('I open the component test harness', async ({ page }) => {
  await page.goto(`${getBaseUrl()}/examples/test-harness`);
  await expect(page.locator('[data-tid="component-test-harness"]')).toBeVisible();
});

Then('the harness switch is off', async ({ page }) => {
  await expect(page.locator('[data-tid="harness-switch"]')).not.toBeChecked();
});

Then('the harness switch is on', async ({ page }) => {
  await expect(page.locator('[data-tid="harness-switch"]')).toBeChecked();
});

Then('the harness switch value readout is {string}', async ({ page }, value: string) => {
  await expect(page.locator('[data-tid="harness-switch-value"]')).toHaveText(value);
});

When('I turn the harness switch on', async ({ page }) => {
  // Visually hidden input; click the visible <label> as a user would.
  const sw = page.locator('[data-tid="harness-switch"]');
  if (!(await sw.isChecked())) await page.locator('label[for="harness-switch"]').click();
  await expect(sw).toBeChecked();
});

Then('the harness form isFurry switch is off', async ({ page }) => {
  await expect(page.locator('[data-tid="isFurry"]')).not.toBeChecked();
});

When('I turn the harness form isFurry switch on', async ({ page }) => {
  // The design-system Switch input is visually hidden (0x0, opacity 0); click its visible <label> as a user would.
  const sw = page.locator('[data-tid="isFurry"]');
  if (!(await sw.isChecked())) await page.locator('label[for="isFurry"]').click();
  await expect(sw).toBeChecked();
});

Then('the harness json form isFurry readout is {string}', async ({ page }, value: string) => {
  await expect(page.locator('[data-tid="harness-json-form-value-isFurry"]')).toHaveText(value);
});

When('I add harness attribute tags {string}', async ({ page }, csv: string) => {
  const tags = csv.split(',').map((s) => s.trim()).filter(Boolean);
  const input = page.locator('[data-tid="attributes"]');
  for (const tag of tags) {
    await input.fill(tag);
    await input.press('Enter');
  }
});

Then('the harness json form attributes readout is {string}', async ({ page }, value: string) => {
  await expect(page.locator('[data-tid="harness-json-form-value-attributes"]')).toHaveText(value);
});

When('I remove the harness attribute tag at index {int}', async ({ page }, index: number) => {
  await page.locator(`[data-tid="attributes-tag-${index}-remove"]`).click();
});

Then('the harness read-only switch cannot be toggled', async ({ page }) => {
  const sw = page.locator('[data-tid="harness-switch-readonly"]');
  await expect(sw).toBeDisabled();
  await expect(sw).toBeChecked();
});

When('I enable harness form read-only', async ({ page }) => {
  await page.locator('[data-tid="harness-form-readonly-toggle"]').check();
});

Then('the harness json form switch cannot be toggled', async ({ page }) => {
  const sw = page.locator('[data-tid="isFurry"]');
  await expect(sw).toBeDisabled();
});

Then('the harness json form attributes have no add or remove controls', async ({ page }) => {
  await expect(page.locator('[data-tid="attributes"]')).toHaveCount(0);
  await expect(
    page.locator('[data-tid^="attributes-tag-"][data-tid$="-remove"]')
  ).toHaveCount(0);
});

When('I set harness permissions via {string}', async ({ page }, tid: string) => {
  await page.locator(`[data-tid="${tid}"]`).click();
  await expect(page.locator('[data-tid="harness-session-permissions"]')).toBeVisible();
});

When('I open harness grid {string} row {int} actions', async ({ page }, gridTid: string, rowIndex: number) => {
  await page.locator(`[data-tid="${gridTid}-row-${rowIndex}-actions"]`).click();
  await expect(page.locator('[role="menu"]')).toBeVisible();
});

Then('harness grid {string} has no Actions column', async ({ page }, gridTid: string) => {
  const section = page.locator(`[data-tid="${gridTid}-section"]`);
  await expect(section.locator(`[data-tid="${gridTid}"]`)).toBeVisible();
  await expect(section.locator('thead th', { hasText: 'Actions' })).toHaveCount(0);
  await expect(section.locator(`[data-tid^="${gridTid}-row-"][data-tid$="-actions"]`)).toHaveCount(0);
});

Then('harness grid {string} row {int} has no actions trigger', async ({ page }, gridTid: string, rowIndex: number) => {
  await expect(page.locator(`[data-tid="${gridTid}-row-${rowIndex}-actions"]`)).toHaveCount(0);
});

Then('harness grid {string} row {int} has an actions trigger', async ({ page }, gridTid: string, rowIndex: number) => {
  await expect(page.locator(`[data-tid="${gridTid}-row-${rowIndex}-actions"]`)).toBeVisible();
});

Then(
  'the harness bool {string} is named {string} with value {string}',
  async ({ page }, tid: string, name: string, value: string) => {
    const el = page.locator(`[data-tid="${tid}"] [data-boolean-value]`);
    await expect(el).toHaveCount(1);
    await expect(el).toHaveAttribute('aria-label', name);
    await expect(el).toHaveAttribute('data-boolean-value', value);
  }
);

Then('the harness bool {string} shows an em dash with no circle', async ({ page }, tid: string) => {
  const el = page.locator(`[data-tid="${tid}"]`).locator('[data-boolean-value="null"]').first();
  await expect(el).toContainText('\u2014');
  await expect(el.locator('[data-icon]')).toHaveCount(0);
  const [bg, colour, expected] = await el.evaluate((node) => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--app-text-primary)';
    document.body.appendChild(probe);
    const want = getComputedStyle(probe).color;
    probe.remove();
    const s = getComputedStyle(node);
    return [s.backgroundColor, s.color, want];
  });
  expect(bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent').toBeTruthy();
  expect(colour).toBe(expected);
});

Then('the harness bool switch cell is a read-only switch', async ({ page }) => {
  // The Switch input itself is visually hidden by design; the visible part is its label/track.
  const cell = page.locator('[data-tid="harness-bool-switch-cell"]');
  await expect(cell.locator('label')).toBeVisible();
  const sw = cell.getByRole('switch', { name: 'Still available' });
  await expect(sw).toBeAttached();
  await expect(sw).toBeChecked();
  await expect(sw).toBeDisabled();
});

Then('the open actions menu lists {string}', async ({ page }, csv: string) => {
  const expected = csv.split(',').map((s) => s.trim()).filter(Boolean);
  const items = page.locator('[role="menu"] [role="menuitem"]');
  await expect(items).toHaveCount(expected.length);
  for (let i = 0; i < expected.length; i++) {
    await expect(items.nth(i)).toContainText(expected[i]);
  }
});

Then('the open actions menu does not list {string}', async ({ page }, csv: string) => {
  const forbidden = csv.split(',').map((s) => s.trim()).filter(Boolean);
  const text = await page.locator('[role="menu"]').innerText();
  for (const label of forbidden) expect(text).not.toContain(label);
});
