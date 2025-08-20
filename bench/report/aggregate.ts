import fs from "fs/promises";
import path from "path";
import { stringify } from "csv-stringify/sync";

interface BenchmarkData {
  marks: Array<{ name: string; startTime: number; duration?: number }>;
  longTasks: Array<{ startTime: number; duration: number }>;
  heap: { usedJSHeapSize: number };
  dom: { mutations: number };
}

interface AggregatedResult {
  app: string;
  scenario: string;
  metric: string;
  median: number;
  p95: number;
  count: number;
  values: number[];
}

function calculateStats(values: number[]) {
  if (values.length === 0) return { median: 0, p95: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95Index = Math.floor(sorted.length * 0.95);
  const p95 = sorted[Math.min(p95Index, sorted.length - 1)];
  return { median, p95 };
}

async function getLatestRunId(): Promise<string | null> {
  const base = path.join("bench", "results");
  try {
    const timestamps = await fs.readdir(base);
    const validTimestamps = timestamps.filter((t) => t !== ".gitkeep");
    return validTimestamps.sort().pop() || null;
  } catch {
    return null;
  }
}

async function aggregateResults(runId: string, incremental = false) {
  const base = path.join("bench", "results", runId);
  const summaryDir = path.join(base, "summary");
  await fs.mkdir(summaryDir, { recursive: true });

  const results: AggregatedResult[] = [];
  const rawData: Array<{
    app: string;
    scenario: string;
    run: string;
    updateLatency: number;
    longTaskCount: number;
    longTaskDuration: number;
    heapSize: number;
    domMutations: number;
  }> = [];

  try {
    const apps = await fs.readdir(base);
    for (const app of apps.filter((a) => a !== "summary")) {
      const appPath = path.join(base, app);
      try {
        const scenarios = await fs.readdir(appPath);
        for (const scenario of scenarios) {
          const scenarioPath = path.join(appPath, scenario);
          const files = await fs.readdir(scenarioPath);
          const jsonFiles = files.filter((f) => f.endsWith(".json"));

          if (jsonFiles.length === 0) continue;

          const updateLatencies: number[] = [];
          const longTaskCounts: number[] = [];
          const longTaskDurations: number[] = [];
          const heapSizes: number[] = [];
          const domMutations: number[] = [];

          for (const file of jsonFiles) {
            try {
              const data: BenchmarkData = JSON.parse(
                await fs.readFile(path.join(scenarioPath, file), "utf-8")
              );

              // Calculate update latency from marks or long tasks
              const updateLatency =
                data.marks.length > 0
                  ? data.marks.reduce(
                      (sum, mark) => sum + (mark.duration || 0),
                      0
                    )
                  : data.longTasks.reduce(
                      (sum, task) => sum + task.duration,
                      0
                    );

              updateLatencies.push(updateLatency);
              longTaskCounts.push(data.longTasks.length);
              longTaskDurations.push(
                data.longTasks.reduce((sum, task) => sum + task.duration, 0)
              );
              heapSizes.push(data.heap.usedJSHeapSize / 1024 / 1024); // Convert to MB
              domMutations.push(data.dom.mutations);

              // Add to raw data
              rawData.push({
                app,
                scenario,
                run: file.replace(".json", ""),
                updateLatency,
                longTaskCount: data.longTasks.length,
                longTaskDuration: data.longTasks.reduce(
                  (sum, task) => sum + task.duration,
                  0
                ),
                heapSize: data.heap.usedJSHeapSize / 1024 / 1024,
                domMutations: data.dom.mutations,
              });
            } catch (error) {
              console.warn(`Failed to process ${file}:`, error);
            }
          }

          // Calculate aggregated stats
          if (updateLatencies.length > 0) {
            const metrics = [
              { name: "updateLatency", values: updateLatencies, unit: "ms" },
              { name: "longTaskCount", values: longTaskCounts, unit: "count" },
              {
                name: "longTaskDuration",
                values: longTaskDurations,
                unit: "ms",
              },
              { name: "heapSize", values: heapSizes, unit: "MB" },
              { name: "domMutations", values: domMutations, unit: "count" },
            ];

            for (const metric of metrics) {
              const stats = calculateStats(metric.values);
              results.push({
                app,
                scenario,
                metric: metric.name,
                median: stats.median,
                p95: stats.p95,
                count: metric.values.length,
                values: metric.values,
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to process app ${app}:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to read results directory:", error);
    return;
  }

  // Write aggregated CSV
  const aggregatedCsv = stringify(
    results.map((r) => ({
      app: r.app,
      scenario: r.scenario,
      metric: r.metric,
      median: r.median.toFixed(2),
      p95: r.p95.toFixed(2),
      count: r.count,
    })),
    { header: true }
  );
  await fs.writeFile(path.join(summaryDir, "aggregated.csv"), aggregatedCsv);

  // Write raw data CSV
  const rawCsv = stringify(rawData, { header: true });
  await fs.writeFile(path.join(summaryDir, "raw_data.csv"), rawCsv);

  // Write per-metric CSVs
  const metrics = [
    "updateLatency",
    "longTaskCount",
    "longTaskDuration",
    "heapSize",
    "domMutations",
  ];
  for (const metric of metrics) {
    const metricResults = results.filter((r) => r.metric === metric);
    if (metricResults.length > 0) {
      const metricCsv = stringify(
        metricResults.map((r) => ({
          app: r.app,
          scenario: r.scenario,
          median: r.median.toFixed(2),
          p95: r.p95.toFixed(2),
          count: r.count,
        })),
        { header: true }
      );
      await fs.writeFile(path.join(summaryDir, `${metric}.csv`), metricCsv);
    }
  }

  console.log(
    `✅ Aggregated ${rawData.length} benchmark runs for run ID: ${runId}`
  );
  console.log(
    `📊 Generated summaries for ${results.length} metric combinations`
  );

  // Print progress summary
  const appScenarioCounts = rawData.reduce((acc, row) => {
    const key = `${row.app}-${row.scenario}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log("\n📈 Progress by scenario:");
  Object.entries(appScenarioCounts).forEach(([key, count]) => {
    console.log(`  ${key}: ${count}/10 runs`);
  });

  return runId;
}

// CLI handling
const args = process.argv.slice(2);
const runIdArg = args.find((arg) => arg.startsWith("--run="))?.split("=")[1];
const incremental = args.includes("--incremental");

(async () => {
  const runId = runIdArg || (await getLatestRunId());
  if (!runId) {
    console.error("No benchmark results found");
    process.exit(1);
  }

  await aggregateResults(runId, incremental);
})();
