import { Page } from 'puppeteer';
import { waitForSettle } from '../metrics';

export default async function run(page: Page) {
  await page.select('[data-test="filter-region"]', 'EU');
  await waitForSettle(page);
}
