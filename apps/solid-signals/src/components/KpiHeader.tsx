import { Component, createMemo } from 'solid-js';
import { Row } from 'shared-data';

interface Props { rows: () => Row[]; }

const KpiHeader: Component<Props> = (props) => {
  const metrics = createMemo(() => {
    const r = props.rows();
    const revenue = r.reduce((a, row) => a + row.price * row.qty, 0);
    const units = r.reduce((a, row) => a + row.qty, 0);
    const avgPrice = units ? revenue / units : 0;
    return { revenue, units, avgPrice };
  });
  return (
    <div>
      <span data-test="kpi-revenue">Revenue: {metrics().revenue.toFixed(2)}</span>
      <span data-test="kpi-units"> Units: {metrics().units}</span>
      <span data-test="kpi-avg"> Avg Price: {metrics().avgPrice.toFixed(2)}</span>
    </div>
  );
};
export default KpiHeader;
