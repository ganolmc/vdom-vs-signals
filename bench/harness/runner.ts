import { launch } from './env';
import { waitForSettle, collect } from './metrics';
import { SCENARIOS } from 'scenarios';
import fs from 'fs/promises';
import path from 'path';

const ports: Record<string, number> = { react: 5173, solid: 5174 };
const runs = 1; // simplified

async function runApp(app: 'react' | 'solid') {
  const browser = await launch();
  const page = await browser.newPage();
  const baseUrl = `http://localhost:${ports[app]}`;
  const timestamp = new Date().toISOString().replace(/[:]/g, '-').slice(0,16);

  for (const s of SCENARIOS) {
    for (let i = 0; i < runs; i++) {
      await page.goto(baseUrl);
      await page.click('[data-test="generate"]');
      await waitForSettle(page);
      const mod = await import(`./scenarios/${s.id}.ts`);
      await mod.default(page);
      const data = await collect(page);
      const dir = path.join('bench', 'results', timestamp, app, s.id);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, `${i}.json`), JSON.stringify(data, null, 2));
    }
  }
  await browser.close();
}

const arg = process.argv[2];
(async () => {
  if (arg === 'react' || arg === 'solid') {
    await runApp(arg);
  } else {
    await runApp('react');
    await runApp('solid');
  }
})();
