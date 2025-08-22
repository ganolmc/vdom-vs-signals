import { launch } from "./env";
import { waitForSettle, collect } from "./metrics";
import { SCENARIOS } from "scenarios";
import fs from "fs/promises";
import path from "path";

const ports: Record<string, number> = { react: 5173, solid: 5175 };
const runs = 10; // 10 runs per scenario as required

async function assertSelectors(page: any) {
  const required = [
    '[data-test="filter-region"]',
    '[data-test="filter-timeframe"]',
    '[data-test="col-price"]',
    '[data-test="tick-1pct"]',
    '[data-test="generate"]',
  ];
  for (const sel of required) {
    const found = await page.$(sel);
    if (!found) throw new Error(`Missing selector: ${sel}`);
  }
}

async function runApp(app: "react" | "solid") {
  const browser = await launch();
  const page = await browser.newPage();

  // Set increased timeouts for stability
  page.setDefaultTimeout(120000); // 2 minutes
  page.setDefaultNavigationTimeout(120000);

  // Add console and error logging
  page.on("console", (msg) => console.log(`[${app} console]`, msg.text()));
  page.on("pageerror", (err) => console.error(`[${app} pageerror]`, err));

  const baseUrl = `http://localhost:${ports[app]}`;
  const timestamp = new Date().toISOString().replace(/[:]/g, "-").slice(0, 16);

  console.log(`Starting ${app} benchmarks at ${baseUrl}`);

  try {
    // Navigate and validate selectors once
    await page.goto(baseUrl);
    await assertSelectors(page);
    console.log(`✓ All required selectors found for ${app}`);

    for (const s of SCENARIOS) {
      console.log(`Running ${app} ${s.id}...`);
      for (let i = 0; i < runs; i++) {
        try {
          console.log(`  ${app} ${s.id} run ${i + 1}/${runs}`);
          await page.goto(baseUrl);
          await page.click('[data-test="generate"]');
          await waitForSettle(page);
          const mod = await import(`./scenarios/${s.id}.ts`);
          await mod.default(page);
          const data = await collect(page);
          const dir = path.join("bench", "results", timestamp, app, s.id);
          await fs.mkdir(dir, { recursive: true });
          await fs.writeFile(
            path.join(dir, `${i}.json`),
            JSON.stringify(data, null, 2)
          );
        } catch (error) {
          console.error(`Failed ${app} ${s.id} run ${i + 1}:`, error);

          // Create debug bundle on failure
          const debugDir = path.join("bench", "results", timestamp, "debug");
          await fs.mkdir(debugDir, { recursive: true });

          try {
            await page.screenshot({
              path: path.join(debugDir, `${app}-${s.id}-${i}.png`),
              fullPage: true,
            });
            const html = await page.content();
            await fs.writeFile(
              path.join(debugDir, `${app}-${s.id}-${i}.html`),
              html
            );
            const perf = await page.evaluate(
              () => (window as any).__perf?.collect?.() ?? {}
            );
            await fs.writeFile(
              path.join(debugDir, `${app}-${s.id}-${i}.json`),
              JSON.stringify(perf, null, 2)
            );
          } catch (debugError) {
            console.error("Failed to create debug bundle:", debugError);
          }

          throw error; // Re-throw to fail the benchmark
        }
      }
      console.log(`✓ Completed ${app} ${s.id}`);
    }
  } finally {
    await browser.close();
  }
}

const arg = process.argv[2];
(async () => {
  if (arg === "react" || arg === "solid") {
    await runApp(arg);
  } else {
    await runApp("react");
    await runApp("solid");
  }
})();
