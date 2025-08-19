import { Page } from 'puppeteer';
import { waitForSettle } from '../metrics';

export default async function run(page: Page) {
  for (let i = 0; i < 5; i++) {
    await page.click('[data-test="col-price"]');
    await waitForSettle(page);
  }
}
