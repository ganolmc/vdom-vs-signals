import { jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
export default function KpiHeader({ rows }) {
    const metrics = useMemo(() => {
        const revenue = rows.reduce((a, r) => a + r.price * r.qty, 0);
        const units = rows.reduce((a, r) => a + r.qty, 0);
        const avgPrice = units ? revenue / units : 0;
        return { revenue, units, avgPrice };
    }, [rows]);
    return (_jsxs("div", { children: [_jsxs("span", { "data-test": "kpi-revenue", children: ["Revenue: ", metrics.revenue.toFixed(2)] }), _jsxs("span", { "data-test": "kpi-units", children: [" Units: ", metrics.units] }), _jsxs("span", { "data-test": "kpi-avg", children: [" Avg Price: ", metrics.avgPrice.toFixed(2)] })] }));
}
