import fs from "fs/promises";
import path from "path";

interface MetricData {
  app: string;
  scenario: string;
  median: number;
  p95: number;
  count: number;
}

async function readMetricCsv(filePath: string): Promise<MetricData[]> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.trim().split("\n");

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

async function populateReport(runId: string) {
  const summaryDir = path.join("bench", "results", runId, "summary");
  const reportPath = path.join("bench", "reports", runId, "article_report.md");

  // Read all metric data
  const updateLatency = await readMetricCsv(
    path.join(summaryDir, "updateLatency.csv")
  );
  const domMutations = await readMetricCsv(
    path.join(summaryDir, "domMutations.csv")
  );
  const heapSize = await readMetricCsv(path.join(summaryDir, "heapSize.csv"));
  const longTaskCount = await readMetricCsv(
    path.join(summaryDir, "longTaskCount.csv")
  );
  const longTaskDuration = await readMetricCsv(
    path.join(summaryDir, "longTaskDuration.csv")
  );

  // Read the report template
  let reportContent = await fs.readFile(reportPath, "utf-8");

  // Helper function to get metric value
  const getMetric = (
    data: MetricData[],
    app: string,
    scenario: string,
    stat: "median" | "p95"
  ) => {
    const entry = data.find((d) => d.app === app && d.scenario === scenario);
    return entry ? entry[stat].toFixed(2) : "N/A";
  };

  // Helper function to calculate averages
  const getAverage = (
    data: MetricData[],
    app: string,
    stat: "median" | "p95"
  ) => {
    const appData = data.filter((d) => d.app === app);
    if (appData.length === 0) return "N/A";
    const avg = appData.reduce((sum, d) => sum + d[stat], 0) / appData.length;
    return avg.toFixed(2);
  };

  // Populate Executive Summary placeholders
  const s2SolidMedian = getMetric(
    updateLatency,
    "solid",
    "S2_UPDATE_1PCT",
    "median"
  );
  const s2ReactMedian = getMetric(
    updateLatency,
    "react",
    "S2_UPDATE_1PCT",
    "median"
  );

  // Calculate DOM mutations comparison
  const reactDomAvg = parseFloat(getAverage(domMutations, "react", "median"));
  const solidDomAvg = parseFloat(getAverage(domMutations, "solid", "median"));
  const domReduction =
    reactDomAvg > 0
      ? (((reactDomAvg - solidDomAvg) / reactDomAvg) * 100).toFixed(1)
      : "N/A";

  // Calculate heap comparison
  const reactHeapAvg = parseFloat(getAverage(heapSize, "react", "median"));
  const solidHeapAvg = parseFloat(getAverage(heapSize, "solid", "median"));
  const heapDiff =
    reactHeapAvg > 0
      ? (((solidHeapAvg - reactHeapAvg) / reactHeapAvg) * 100).toFixed(1)
      : "N/A";

  // Find React's competitive scenarios (where React performs within 20% of Solid)
  const competitiveScenarios: string[] = [];
  for (const scenario of [
    "S1_FILTER",
    "S2_UPDATE_1PCT",
    "S3_INSERT_1K",
    "S4_REMOVE_1K",
    "S5_SORT_COL",
  ]) {
    const reactMedian = parseFloat(
      getMetric(updateLatency, "react", scenario, "median")
    );
    const solidMedian = parseFloat(
      getMetric(updateLatency, "solid", scenario, "median")
    );
    if (solidMedian > 0 && reactMedian / solidMedian <= 1.2) {
      competitiveScenarios.push(scenario);
    }
  }

  // Replace placeholders
  const replacements: Record<string, string> = {
    // Executive Summary
    PLACEHOLDER_S2_SOLID_MEDIAN: s2SolidMedian,
    PLACEHOLDER_S2_REACT_MEDIAN: s2ReactMedian,
    PLACEHOLDER_DOM_MUTATIONS_COMPARISON:
      domReduction !== "N/A" ? `${domReduction}%` : "comparable",
    PLACEHOLDER_REACT_COMPETITIVE_SCENARIOS:
      competitiveScenarios.length > 0
        ? competitiveScenarios.join(", ")
        : "bulk operations",
    PLACEHOLDER_HEAP_COMPARISON:
      heapDiff !== "N/A"
        ? `${Math.abs(parseFloat(heapDiff))}% ${
            parseFloat(heapDiff) > 0 ? "higher" : "lower"
          }`
        : "comparable",

    // Results section - Update Latency
    PLACEHOLDER_S1_SOLID_MEDIAN: getMetric(
      updateLatency,
      "solid",
      "S1_FILTER",
      "median"
    ),
    PLACEHOLDER_S1_REACT_MEDIAN: getMetric(
      updateLatency,
      "react",
      "S1_FILTER",
      "median"
    ),
    PLACEHOLDER_S1_SOLID_P95: getMetric(
      updateLatency,
      "solid",
      "S1_FILTER",
      "p95"
    ),
    PLACEHOLDER_S1_REACT_P95: getMetric(
      updateLatency,
      "react",
      "S1_FILTER",
      "p95"
    ),

    PLACEHOLDER_S2_SOLID_P95: getMetric(
      updateLatency,
      "solid",
      "S2_UPDATE_1PCT",
      "p95"
    ),
    PLACEHOLDER_S2_REACT_P95: getMetric(
      updateLatency,
      "react",
      "S2_UPDATE_1PCT",
      "p95"
    ),

    PLACEHOLDER_S3_SOLID_MEDIAN: getMetric(
      updateLatency,
      "solid",
      "S3_INSERT_1K",
      "median"
    ),
    PLACEHOLDER_S3_REACT_MEDIAN: getMetric(
      updateLatency,
      "react",
      "S3_INSERT_1K",
      "median"
    ),
    PLACEHOLDER_S3_SOLID_P95: getMetric(
      updateLatency,
      "solid",
      "S3_INSERT_1K",
      "p95"
    ),
    PLACEHOLDER_S3_REACT_P95: getMetric(
      updateLatency,
      "react",
      "S3_INSERT_1K",
      "p95"
    ),

    PLACEHOLDER_S4_SOLID_MEDIAN: getMetric(
      updateLatency,
      "solid",
      "S4_REMOVE_1K",
      "median"
    ),
    PLACEHOLDER_S4_REACT_MEDIAN: getMetric(
      updateLatency,
      "react",
      "S4_REMOVE_1K",
      "median"
    ),
    PLACEHOLDER_S4_SOLID_P95: getMetric(
      updateLatency,
      "solid",
      "S4_REMOVE_1K",
      "p95"
    ),
    PLACEHOLDER_S4_REACT_P95: getMetric(
      updateLatency,
      "react",
      "S4_REMOVE_1K",
      "p95"
    ),

    PLACEHOLDER_S5_SOLID_MEDIAN: getMetric(
      updateLatency,
      "solid",
      "S5_SORT_COL",
      "median"
    ),
    PLACEHOLDER_S5_REACT_MEDIAN: getMetric(
      updateLatency,
      "react",
      "S5_SORT_COL",
      "median"
    ),
    PLACEHOLDER_S5_SOLID_P95: getMetric(
      updateLatency,
      "solid",
      "S5_SORT_COL",
      "p95"
    ),
    PLACEHOLDER_S5_REACT_P95: getMetric(
      updateLatency,
      "react",
      "S5_SORT_COL",
      "p95"
    ),

    // Analysis placeholders
    PLACEHOLDER_LONG_TASK_ANALYSIS: generateLongTaskAnalysis(
      longTaskCount,
      longTaskDuration
    ),
    PLACEHOLDER_HEAP_ANALYSIS: generateHeapAnalysis(heapSize),
    PLACEHOLDER_DOM_MUTATIONS_ANALYSIS:
      generateDomMutationsAnalysis(domMutations),
    PLACEHOLDER_BULK_OPERATIONS_ANALYSIS:
      generateBulkOperationsAnalysis(updateLatency),
    PLACEHOLDER_SORTING_ANALYSIS: generateSortingAnalysis(updateLatency),

    PLACEHOLDER_GENERATION_TIME: new Date().toISOString(),
  };

  // Apply all replacements
  for (const [placeholder, value] of Object.entries(replacements)) {
    reportContent = reportContent.replace(
      new RegExp(`\\*\\*\\[${placeholder}\\]\\*\\*`, "g"),
      `**${value}**`
    );
  }

  // Write the populated report
  await fs.writeFile(reportPath, reportContent);

  console.log(`✅ Populated report with actual benchmark data`);
  console.log(`📄 Report available at: ${reportPath}`);

  // Print summary table
  console.log("\n📊 Performance Summary (Median Latency in ms):");
  console.log(
    "Scenario".padEnd(15) +
      "React".padEnd(10) +
      "Solid".padEnd(10) +
      "Difference"
  );
  console.log("-".repeat(50));

  for (const scenario of [
    "S1_FILTER",
    "S2_UPDATE_1PCT",
    "S3_INSERT_1K",
    "S4_REMOVE_1K",
    "S5_SORT_COL",
  ]) {
    const reactVal = parseFloat(
      getMetric(updateLatency, "react", scenario, "median")
    );
    const solidVal = parseFloat(
      getMetric(updateLatency, "solid", scenario, "median")
    );
    const diff =
      reactVal > 0 && solidVal > 0
        ? `${(((reactVal - solidVal) / solidVal) * 100).toFixed(1)}%`
        : "N/A";

    console.log(
      scenario.padEnd(15) +
        (reactVal > 0 ? reactVal.toFixed(2) : "N/A").padEnd(10) +
        (solidVal > 0 ? solidVal.toFixed(2) : "N/A").padEnd(10) +
        diff
    );
  }
}

function generateLongTaskAnalysis(
  countData: MetricData[],
  durationData: MetricData[]
): string {
  const reactCount = countData.filter((d) => d.app === "react");
  const solidCount = countData.filter((d) => d.app === "solid");

  if (reactCount.length === 0 && solidCount.length === 0) {
    return "Long task data is not available for analysis.";
  }

  const reactAvgCount =
    reactCount.length > 0
      ? reactCount.reduce((sum, d) => sum + d.median, 0) / reactCount.length
      : 0;
  const solidAvgCount =
    solidCount.length > 0
      ? solidCount.reduce((sum, d) => sum + d.median, 0) / solidCount.length
      : 0;

  if (solidAvgCount < reactAvgCount) {
    return `Solid generates ${(
      ((reactAvgCount - solidAvgCount) / reactAvgCount) *
      100
    ).toFixed(
      1
    )}% fewer long tasks on average, indicating better frame rate consistency.`;
  } else {
    return `Both frameworks show similar long task patterns, with React averaging ${reactAvgCount.toFixed(
      1
    )} and Solid ${solidAvgCount.toFixed(1)} long tasks per scenario.`;
  }
}

function generateHeapAnalysis(heapData: MetricData[]): string {
  const reactHeap = heapData.filter((d) => d.app === "react");
  const solidHeap = heapData.filter((d) => d.app === "solid");

  if (reactHeap.length === 0 && solidHeap.length === 0) {
    return "Heap usage data is not available for analysis.";
  }

  const reactAvg =
    reactHeap.length > 0
      ? reactHeap.reduce((sum, d) => sum + d.median, 0) / reactHeap.length
      : 0;
  const solidAvg =
    solidHeap.length > 0
      ? solidHeap.reduce((sum, d) => sum + d.median, 0) / solidHeap.length
      : 0;

  const diff = Math.abs(reactAvg - solidAvg);
  const pctDiff = reactAvg > 0 ? ((diff / reactAvg) * 100).toFixed(1) : "0";

  if (solidAvg < reactAvg) {
    return `${pctDiff}% lower heap usage in Solid (${solidAvg.toFixed(
      1
    )}MB avg) compared to React (${reactAvg.toFixed(
      1
    )}MB avg), reflecting Solid's more memory-efficient reactivity system.`;
  } else {
    return `comparable heap usage patterns between frameworks, with React averaging ${reactAvg.toFixed(
      1
    )}MB and Solid ${solidAvg.toFixed(1)}MB.`;
  }
}

function generateDomMutationsAnalysis(domData: MetricData[]): string {
  const reactDom = domData.filter((d) => d.app === "react");
  const solidDom = domData.filter((d) => d.app === "solid");

  if (reactDom.length === 0 && solidDom.length === 0) {
    return "DOM mutations data is not available for analysis.";
  }

  const reactAvg =
    reactDom.length > 0
      ? reactDom.reduce((sum, d) => sum + d.median, 0) / reactDom.length
      : 0;
  const solidAvg =
    solidDom.length > 0
      ? solidDom.reduce((sum, d) => sum + d.median, 0) / solidDom.length
      : 0;

  if (solidAvg < reactAvg) {
    return `Solid's fine-grained reactivity results in ${(
      ((reactAvg - solidAvg) / reactAvg) *
      100
    ).toFixed(1)}% fewer DOM mutations (${solidAvg.toFixed(
      0
    )} vs ${reactAvg.toFixed(
      0
    )} average), demonstrating more surgical updates compared to React's reconciliation process.`;
  } else {
    return `Both frameworks show similar DOM mutation patterns, indicating comparable update efficiency in these scenarios.`;
  }
}

function generateBulkOperationsAnalysis(latencyData: MetricData[]): string {
  const s3React = latencyData.find(
    (d) => d.app === "react" && d.scenario === "S3_INSERT_1K"
  );
  const s3Solid = latencyData.find(
    (d) => d.app === "solid" && d.scenario === "S3_INSERT_1K"
  );
  const s4React = latencyData.find(
    (d) => d.app === "react" && d.scenario === "S4_REMOVE_1K"
  );
  const s4Solid = latencyData.find(
    (d) => d.app === "solid" && d.scenario === "S4_REMOVE_1K"
  );

  if (!s3React || !s3Solid || !s4React || !s4Solid) {
    return "Bulk operations show mixed results depending on the specific operation type and data characteristics.";
  }

  const insertDiff = ((s3React.median - s3Solid.median) / s3Solid.median) * 100;
  const removeDiff = ((s4React.median - s4Solid.median) / s4Solid.median) * 100;

  return `Insert operations favor ${
    insertDiff > 0 ? "Solid" : "React"
  } by ${Math.abs(insertDiff).toFixed(1)}%, while remove operations favor ${
    removeDiff > 0 ? "Solid" : "React"
  } by ${Math.abs(removeDiff).toFixed(
    1
  )}%. This reflects different optimization strategies for bulk DOM manipulations.`;
}

function generateSortingAnalysis(latencyData: MetricData[]): string {
  const s5React = latencyData.find(
    (d) => d.app === "react" && d.scenario === "S5_SORT_COL"
  );
  const s5Solid = latencyData.find(
    (d) => d.app === "solid" && d.scenario === "S5_SORT_COL"
  );

  if (!s5React || !s5Solid) {
    return "Sorting performance varies based on implementation details and data size.";
  }

  const diff = ((s5React.median - s5Solid.median) / s5Solid.median) * 100;

  if (Math.abs(diff) < 20) {
    return `Sorting operations show comparable performance (${Math.abs(
      diff
    ).toFixed(
      1
    )}% difference), suggesting that both frameworks handle list reordering efficiently when proper keys are used.`;
  } else {
    return `Sorting operations favor ${
      diff > 0 ? "Solid" : "React"
    } by ${Math.abs(diff).toFixed(1)}%, likely due to ${
      diff > 0
        ? "Solid's direct DOM manipulation"
        : "React's optimized reconciliation for keyed lists"
    }.`;
  }
}

// CLI handling
const args = process.argv.slice(2);
const runIdArg = args.find((arg) => arg.startsWith("--run="))?.split("=")[1];

(async () => {
  const runId = runIdArg || (await getLatestRunId());
  if (!runId) {
    console.error("No benchmark results found");
    process.exit(1);
  }

  await populateReport(runId);
})();
