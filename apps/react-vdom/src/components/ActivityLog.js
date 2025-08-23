import { jsx as _jsx } from "react/jsx-runtime";
export default function ActivityLog({ logs }) {
    return (_jsx("ul", { "data-test": "activity-log", children: logs.map((l, i) => (_jsx("li", { children: l }, i))) }));
}
