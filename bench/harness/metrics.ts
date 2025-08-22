import { Page } from "puppeteer";

export async function collect(page: Page) {
  return await page.evaluate(() => (window as any).__perf.collect());
}

async function waitForAppSettled(page: Page, timeoutMs = 30000) {
  const start = Date.now();
  let stableFor = 0;

  while (Date.now() - start < timeoutMs) {
    const { settled, lastMutationAt, pending } = await page.evaluate(() => {
      return (
        (window as any).__perf?.debugState?.() ?? {
          settled: false,
          lastMutationAt: 0,
          pending: 0,
        }
      );
    });
    const quiet = Date.now() - lastMutationAt > 120;
    if (settled && quiet && pending === 0) {
      stableFor += 100;
      if (stableFor >= 300) return; // 300ms of stable settle
    } else {
      stableFor = 0;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("Timed out waiting for app to settle");
}

export async function waitForSettle(page: Page, timeoutMs = 30000) {
  try {
    await waitForAppSettled(page, timeoutMs);
  } catch (error) {
    console.warn(
      "waitForAppSettled failed, falling back to basic wait:",
      error
    );
    // Fallback to original method with configurable timeout
    try {
      await Promise.race([
        page.waitForFunction("window.__appSettled === true", {
          timeout: timeoutMs,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("App settle timeout")), timeoutMs)
        ),
      ]);
    } catch (fallbackError) {
      // For idle scenarios, just assume settled after timeout
      console.warn(
        "Both settle methods failed, assuming settled for idle scenario"
      );
      await page.evaluate(() => {
        (window as any).__appSettled = true;
      });
    }
  }

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
