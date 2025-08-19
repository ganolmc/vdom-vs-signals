import { Page } from 'puppeteer';
import { waitForSettle } from '../metrics';

export default async function run(page: Page) {
  await page.waitForTimeout(30000);
  await waitForSettle(page);
}
