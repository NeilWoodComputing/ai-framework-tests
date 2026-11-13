import { test as base, createBdd } from 'playwright-bdd';
import { el, getButton, getEditableInEl, getInputInEl } from '../../helpers/selectors';

interface Fixtures {
  el: (tid: string) => ReturnType<typeof el>;
  getInputInEl: (tid: string) => ReturnType<typeof getInputInEl>;
  getEditableInEl: (tid: string) => ReturnType<typeof getEditableInEl>;
  getButton: (tid: string) => ReturnType<typeof getButton>;
}

export const test = base.extend<Fixtures>({
  el: async ({ page }, use) => {
    await use((tid: string) => el(page, tid));
  },
  getInputInEl: async ({ page }, use) => {
    await use((tid: string) => getInputInEl(page, tid));
  },
  getEditableInEl: async ({ page }, use) => {
    await use((tid: string) => getEditableInEl(page, tid));
  },
  getButton: async ({ page }, use) => {
    await use((tid: string) => getButton(page, tid));
  },
});

export const { Given, When, Then, Before, After } = createBdd(test);
