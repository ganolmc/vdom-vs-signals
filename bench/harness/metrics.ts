import { Page } from 'puppeteer';

export async function collect(page: Page) {
  return await page.evaluate(() => (window as any).__perf.collect());
}

export async function waitForSettle(page: Page) {
  await page.waitForFunction('window.__appSettled === true');
  await page.evaluate(() => { (window as any).__appSettled = false; });
}
