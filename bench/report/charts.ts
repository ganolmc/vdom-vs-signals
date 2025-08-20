import fs from "fs/promises";
import path from "path";

interface MetricData {
  app: string;
  scenario: string;
  median: number;
  p95: number;
  count: number;
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

async function readMetricCsv(filePath: string): Promise<MetricData[]> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.trim().split("\n");
    const headers = lines[0].split(",");

    return lines.slice(1).map((line) => {
      const values = line.split(",");
      return {
        app: values[0],
        scenario: values[1],
        median: parseFloat(values[2]),
        p95: parseFloat(values[3]),
        count: parseInt(values[4]),
      };
    });
  } catch {
    return [];
  }
}

function createVegaLiteSpec(
  data: MetricData[],
  metric: string,
  title: string,
  yAxisTitle: string
) {
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: {
      text: title,
      fontSize: 16,
      anchor: "start",
    },
    width: 600,
    height: 400,
    data: {
      values: data.flatMap((d) => [
        {
          app: d.app,
          scenario: d.scenario,
          value: d.median,
          stat: "Median",
          count: d.count,
        },
        {
          app: d.app,
          scenario: d.scenario,
          value: d.p95,
          stat: "P95",
          count: d.count,
        },
      ]),
    },
    mark: {
      type: "bar",
      tooltip: true,
    },
    encoding: {
      x: {
        field: "scenario",
        type: "nominal",
        title: "Scenario",
        axis: { labelAngle: -45 },
      },
      y: {
        field: "value",
        type: "quantitative",
        title: yAxisTitle,
        scale: { zero: false },
      },
      color: {
        field: "app",
        type: "nominal",
        title: "Framework",
        scale: {
          domain: ["react", "solid"],
          range: ["#61dafb", "#2c4f7c"],
        },
      },
      column: {
        field: "stat",
        type: "nominal",
        title: "Statistic",
      },
      tooltip: [
        { field: "app", type: "nominal", title: "Framework" },
        { field: "scenario", type: "nominal", title: "Scenario" },
        { field: "stat", type: "nominal", title: "Statistic" },
        {
          field: "value",
          type: "quantitative",
          title: yAxisTitle,
          format: ".2f",
        },
        { field: "count", type: "quantitative", title: "Sample Size" },
      ],
    },
    resolve: {
      scale: { y: "independent" },
    },
  };
}

async function generateCharts(runId: string) {
  const summaryDir = path.join("bench", "results", runId, "summary");
  const figuresDir = path.join("bench", "reports", runId, "figures");
  await fs.mkdir(figuresDir, { recursive: true });

  const metrics = [
    {
      file: "updateLatency.csv",
      title: "Update Latency Comparison",
      yAxis: "Latency (ms)",
    },
    {
      file: "longTaskCount.csv",
      title: "Long Task Count Comparison",
      yAxis: "Count",
    },
    {
      file: "longTaskDuration.csv",
      title: "Long Task Duration Comparison",
      yAxis: "Duration (ms)",
    },
    {
      file: "heapSize.csv",
      title: "Heap Size Comparison",
      yAxis: "Heap Size (MB)",
    },
    {
      file: "domMutations.csv",
      title: "DOM Mutations Comparison",
      yAxis: "Mutations Count",
    },
  ];

  const generatedCharts: string[] = [];

  for (const metric of metrics) {
    const csvPath = path.join(summaryDir, metric.file);
    const data = await readMetricCsv(csvPath);

    if (data.length === 0) {
      console.log(
        `⚠️  No data found for ${metric.file}, skipping chart generation`
      );
      continue;
    }

    const metricName = metric.file.replace(".csv", "");
    const spec = createVegaLiteSpec(
      data,
      metricName,
      metric.title,
      metric.yAxis
    );

    // Write Vega-Lite spec as JSON
    const specPath = path.join(figuresDir, `${metricName}_spec.json`);
    await fs.writeFile(specPath, JSON.stringify(spec, null, 2));

    // Create a simple HTML file that renders the chart
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>${metric.title}</title>
  <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    #vis { margin: 20px 0; }
  </style>
</head>
<body>
  <h1>${metric.title}</h1>
  <div id="vis"></div>
  <script>
    const spec = ${JSON.stringify(spec)};
    vegaEmbed('#vis', spec, {
      actions: { export: true, source: false, compiled: false, editor: false }
    }).then(result => {
      // Export as PNG
      result.view.toImageURL('png').then(url => {
        const link = document.createElement('a');
        link.download = '${metricName}.png';
        link.href = url;
        document.body.appendChild(link);
        console.log('PNG export ready for ${metricName}');
      });
      
      // Export as SVG
      result.view.toImageURL('svg').then(url => {
        const link = document.createElement('a');
        link.download = '${metricName}.svg';
        link.href = url;
        document.body.appendChild(link);
        console.log('SVG export ready for ${metricName}');
      });
    });
  </script>
</body>
</html>`;

    const htmlPath = path.join(figuresDir, `${metricName}.html`);
    await fs.writeFile(htmlPath, htmlContent);

    generatedCharts.push(`${metricName}.html`);

    console.log(`📊 Generated chart for ${metric.title}`);
  }

  // Create an index file for all charts
  const indexContent = `<!DOCTYPE html>
<html>
<head>
  <title>Benchmark Charts - Run ${runId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    .chart-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
    .chart-card h3 { margin-top: 0; }
    .chart-card iframe { width: 100%; height: 500px; border: none; }
  </style>
</head>
<body>
  <h1>React vs Solid Benchmark Results</h1>
  <p><strong>Run ID:</strong> ${runId}</p>
  <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
  
  <div class="chart-grid">
    ${generatedCharts
      .map((chart) => {
        const title = chart
          .replace(".html", "")
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase());
        return `
        <div class="chart-card">
          <h3>${title}</h3>
          <iframe src="figures/${chart}"></iframe>
        </div>
      `;
      })
      .join("")}
  </div>
</body>
</html>`;

  const reportsDir = path.join("bench", "reports", runId);
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(path.join(reportsDir, "charts_index.html"), indexContent);

  console.log(
    `✅ Generated ${generatedCharts.length} charts for run ID: ${runId}`
  );
  console.log(`📁 Charts available at: bench/reports/${runId}/figures/`);
  console.log(
    `🌐 View all charts at: bench/reports/${runId}/charts_index.html`
  );

  return generatedCharts;
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

  await generateCharts(runId);
})();
