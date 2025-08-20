import { Page } from "puppeteer";

export async function collect(page: Page) {
  return await page.evaluate(() => (window as any).__perf.collect());
}

export async function waitForSettle(page: Page) {
  // Wait for app to settle with timeout protection
  await Promise.race([
    page.waitForFunction("window.__appSettled === true", { timeout: 30000 }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("App settle timeout")), 30000)
    ),
  ]);

  // Additional stability measures
  await page.evaluate(async () => {
    // Wait for two animation frames to ensure rendering is complete
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );

    // Flush microtasks
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Small idle delay after DOM mutations
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Reset the settled flag
    (window as any).__appSettled = false;
  });
}
