import fs from 'fs/promises';
import path from 'path';

(async () => {
  const base = path.join('bench', 'results');
  const timestamps = await fs.readdir(base);
  const latest = timestamps.sort().pop();
  if (!latest) return;
  const summaryCsv = await fs.readFile(path.join(base, latest, 'summary', 'results.csv'), 'utf-8');
  const rows = summaryCsv.trim().split('\n').slice(1).map(l => {
    const [app, scenario, run, dom, heap] = l.split(',');
    return { app, scenario, run, dom: Number(dom), heap: Number(heap) };
  });
  const html = `<!doctype html><html><body><div id="vis"></div>
<script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
<script>const data=${JSON.stringify(rows)};const spec={data:{values:data},mark:'bar',encoding:{x:{field:'scenario'},y:{field:'dom',type:'quantitative'},color:{field:'app'}}};vegaEmbed('#vis',spec);</script>
</body></html>`;
  const reportDir = path.join('bench', 'reports', latest);
  await fs.mkdir(reportDir, { recursive: true });
  await fs.writeFile(path.join(reportDir, 'index.html'), html);
})();
