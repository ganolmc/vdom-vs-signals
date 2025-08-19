import fs from 'fs/promises';
import path from 'path';
import { stringify } from 'csv-stringify/sync';

(async () => {
  const base = path.join('bench', 'results');
  const timestamps = await fs.readdir(base);
  const latest = timestamps.sort().pop();
  if (!latest) return;
  const rows: any[] = [];
  for (const app of await fs.readdir(path.join(base, latest))) {
    for (const scenario of await fs.readdir(path.join(base, latest, app))) {
      for (const file of await fs.readdir(path.join(base, latest, app, scenario))) {
        const data = JSON.parse(await fs.readFile(path.join(base, latest, app, scenario, file), 'utf-8'));
        rows.push({ app, scenario, run: file.replace('.json',''), dom: data.dom?.mutations || 0, heap: data.heap?.usedJSHeapSize || 0 });
      }
    }
  }
  const csv = stringify(rows, { header: true });
  const summaryDir = path.join(base, latest, 'summary');
  await fs.mkdir(summaryDir, { recursive: true });
  await fs.writeFile(path.join(summaryDir, 'results.csv'), csv);
})();
