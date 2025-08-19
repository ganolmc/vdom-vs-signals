import { Page } from 'puppeteer';
import { waitForSettle } from '../metrics';

export default async function run(page: Page) {
  await page.click('[data-test="insert-1k"]');
  await waitForSettle(page);
}
