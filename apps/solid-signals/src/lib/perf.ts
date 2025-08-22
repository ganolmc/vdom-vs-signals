// perf.ts (Solid) – robust settle + metrics
type PerfData = {
  marks: Array<{ name: string; startTime: number; duration?: number }>;
  longTasks: Array<{ startTime: number; duration: number }>;
  heap?: { usedJSHeapSize?: number };
  dom?: { mutations?: number };
  debug?: { lastMutationAt?: number; pending?: number; settled?: boolean };
};

declare global {
  interface Window {
    __appSettled: boolean;
    __perf: {
      collect: () => PerfData;
      mark: (name: string) => void;
      debugState: () => any;
    };
  }
}

let pending = 0;
let mutationCount = 0;
let lastMutationAt = 0;
let settleTimer: number | null = null;

function markWorkStart() {
  pending++;
  window.__appSettled = false;
}

function scheduleSettleCheck() {
  if (settleTimer) return;
  // Two RAFs + small idle to cover microtasks & layout/paint
  settleTimer = window.setTimeout(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // if no mutations in the last 80ms and no pending work, we consider settled
        const quiet = performance.now() - lastMutationAt > 80;
        if (quiet && pending === 0) {
          window.__appSettled = true;
        } else {
          // keep trying until quiet
          settleTimer = null;
          scheduleSettleCheck();
          return;
        }
        settleTimer = null;
      });
    });
  }, 50);
}

function markWorkEnd() {
  pending = Math.max(0, pending - 1);
  scheduleSettleCheck();
}

// Observe DOM to know when the page is “busy”
const mo = new MutationObserver(() => {
  mutationCount++;
  lastMutationAt = performance.now();
  window.__appSettled = false;
});
mo.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true,
});

// Long tasks (50ms+)
const longTasks: PerfData["longTasks"] = [];
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) {
    if (e.entryType === "longtask") {
      longTasks.push({ startTime: e.startTime, duration: e.duration });
    }
  }
}).observe({ type: "longtask", buffered: true });

// Marks
const marks: PerfData["marks"] = [];
function mark(name: string) {
  performance.mark(name);
  const entries = performance.getEntriesByName(name);
  const last = entries[entries.length - 1];
  marks.push({ name, startTime: last.startTime, duration: last.duration });
}

export function installPerfGlobals() {
  (window as any).__appSettled = true;
  (window as any).__perf = {
    collect: () => ({
      marks,
      longTasks,
      heap: (performance as any).memory
        ? { usedJSHeapSize: (performance as any).memory.usedJSHeapSize }
        : {},
      dom: { mutations: mutationCount },
      debug: { lastMutationAt, pending, settled: window.__appSettled },
    }),
    mark,
    debugState: () => ({
      pending,
      mutationCount,
      lastMutationAt,
      settled: window.__appSettled,
    }),
  };
}

export const Perf = { markWorkStart, markWorkEnd, installPerfGlobals };
