import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';
import { getBaseUrl } from '../../helpers/config';

Given('the UI is running', async () => {
  // Playwright's webServer (or an already-listening BASE_URL) is the running UI.
});

When('I open the home page', async ({ page }) => {
  await page.goto(`${getBaseUrl()}/`);
});

When('I go to {string}', async ({ page }, path: string) => {
  await page.goto(`${getBaseUrl()}${path}`);
});

Then('I am on {string}', async ({ page }, path: string) => {
  await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, '\\/')}(\\?.*)?$`));
});

Then('I see the heading {string}', async ({ page }, text: string) => {
  await expect(page.getByRole('heading', { name: text })).toBeVisible();
});

Then('the layout shell is rendered', async ({ page }) => {
  await expect(page.locator('[data-tid="page-layout"]')).toBeVisible();
  await expect(page.locator('[data-tid="site-nav"]')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Fish', exact: true })).toBeVisible();
});
