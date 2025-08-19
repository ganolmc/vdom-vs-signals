interface PerfData {
  marks: Array<{ name: string; startTime: number; duration?: number }>;
  longTasks: Array<{ startTime: number; duration: number }>;
  heap?: { usedJSHeapSize?: number };
  dom?: { mutations?: number };
}

declare global {
  interface Window {
    __perf: { collect: () => PerfData };
    __appSettled: boolean;
  }
}

let domMutations = 0;
const mo = new MutationObserver(m => (domMutations += m.length));
mo.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });

const longTasks: Array<{ startTime: number; duration: number }> = [];
const po = new PerformanceObserver(list => {
  longTasks.push(...list.getEntries().map(e => ({ startTime: e.startTime, duration: e.duration })));
});
po.observe({ entryTypes: ['longtask'] });

window.__perf = {
  collect() {
    const marks = performance.getEntriesByType('mark').map(m => ({ name: m.name, startTime: m.startTime, duration: (m as any).duration }));
    const heap = (performance as any).memory ? { usedJSHeapSize: (performance as any).memory.usedJSHeapSize } : undefined;
    return { marks, longTasks, heap, dom: { mutations: domMutations } };
  }
};

export function appSettled() {
  requestAnimationFrame(() => {
    window.__appSettled = true;
  });
}
window.__appSettled = false;
