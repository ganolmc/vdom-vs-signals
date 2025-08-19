import { Page } from 'puppeteer';
import { waitForSettle } from '../metrics';

export default async function run(page: Page) {
  for (let i = 0; i < 50; i++) {
    await page.click('[data-test="tick-1pct"]');
    await page.waitForTimeout(100);
  }
  await waitForSettle(page);
}
