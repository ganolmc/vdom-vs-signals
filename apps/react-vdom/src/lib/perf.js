let domMutations = 0;
const mo = new MutationObserver(m => (domMutations += m.length));
mo.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
const longTasks = [];
const po = new PerformanceObserver(list => {
    longTasks.push(...list.getEntries().map(e => ({ startTime: e.startTime, duration: e.duration })));
});
po.observe({ entryTypes: ['longtask'] });
window.__perf = {
    collect() {
        const marks = performance.getEntriesByType('mark').map(m => ({ name: m.name, startTime: m.startTime, duration: m.duration }));
        const heap = performance.memory ? { usedJSHeapSize: performance.memory.usedJSHeapSize } : undefined;
        return { marks, longTasks, heap, dom: { mutations: domMutations } };
    }
};
export function appSettled() {
    requestAnimationFrame(() => {
        window.__appSettled = true;
    });
}
window.__appSettled = false;
