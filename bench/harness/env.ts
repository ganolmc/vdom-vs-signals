import puppeteer, { Browser } from 'puppeteer';

export async function launch(): Promise<Browser> {
  return puppeteer.launch({
    headless: 'new',
    args: [
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--js-flags=--expose-gc'
    ]
  });
}
