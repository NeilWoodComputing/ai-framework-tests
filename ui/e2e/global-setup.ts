import { warmUpUi } from './helpers/warm-up';

/** Runs after Playwright's webServer is up: let `next dev` compile the key scaffold routes. */
export default async function globalSetup() {
  await warmUpUi();
}
