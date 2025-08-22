import { Page } from "puppeteer";
import { waitForSettle } from "../metrics";

export default async function run(page: Page) {
  await page.waitForTimeout(30000);
  // Use longer timeout for idle scenario since app should be settled after 30s idle
  await waitForSettle(page, 10000);
}
