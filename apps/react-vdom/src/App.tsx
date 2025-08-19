import React, { useState, useRef } from 'react';
import Filters from './components/Filters';
import KpiHeader from './components/KpiHeader';
import DataGrid from './components/DataGrid';
import ActivityLog from './components/ActivityLog';
import { createSeededRng, generateRows, mutateRowsFraction, Row, Rng } from 'shared-data';
import { appSettled } from './lib/perf';

export default function App() {
  const [region, setRegion] = useState('US');
  const [timeframe, setTimeframe] = useState('7d');
  const [seed, setSeed] = useState('42');
  const [rows, setRows] = useState<Row[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const rng = useRef<Rng | null>(null);

  const generate = () => {
    rng.current = createSeededRng(seed);
    const r = generateRows(10000, rng.current);
    setRows(r);
    setLogs(l => [`generated ${r.length} rows`, ...l]);
    appSettled();
  };

  const tick = () => {
    if (!rng.current) return;
    const copy = [...rows];
    mutateRowsFraction(copy, 0.01, rng.current);
    setRows(copy);
    setLogs(l => [`tick 1%`, ...l]);
    appSettled();
  };

  const insert1k = () => {
    if (!rng.current) return;
    const start = rows.length;
    const copy = [...rows];
    for (let i = 0; i < 1000; i++) {
      copy.push({
        id: start + i,
        product: `Product ${start + i}`,
        region: 'US',
        price: 0,
        qty: 0,
        updatedAt: Date.now()
      });
    }
    setRows(copy);
    setLogs(l => ['insert 1000', ...l]);
    appSettled();
  };

  const remove1k = () => {
    setRows(r => r.slice(0, Math.max(0, r.length - 1000)));
    setLogs(l => ['remove 1000', ...l]);
    appSettled();
  };

  const sort = (col: keyof Row) => {
    const sorted = [...rows].sort((a, b) => (a[col] > b[col] ? 1 : -1));
    setRows(sorted);
    setLogs(l => [`sort ${String(col)}`, ...l]);
    appSettled();
  };

  return (
    <div>
      <input data-test="seed" value={seed} onChange={e => setSeed(e.target.value)} />
      <button data-test="generate" onClick={generate}>Generate</button>
      <Filters
        region={region}
        timeframe={timeframe}
        onRegionChange={r => { setRegion(r); setLogs(l => [`filter region ${r}`, ...l]); appSettled(); }}
        onTimeframeChange={t => { setTimeframe(t); setLogs(l => [`timeframe ${t}`, ...l]); appSettled(); }}
      />
      <button data-test="tick-1pct" onClick={tick}>Tick 1%</button>
      <button data-test="insert-1k" onClick={insert1k}>Insert 1K</button>
      <button data-test="remove-1k" onClick={remove1k}>Remove 1K</button>
      <KpiHeader rows={rows} />
      <DataGrid rows={rows} onSort={sort} />
      <ActivityLog logs={logs} />
    </div>
  );
}
