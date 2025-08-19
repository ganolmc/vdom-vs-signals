import React, { useMemo } from 'react';
import { Row } from 'shared-data';

interface Props { rows: Row[]; }

export default function KpiHeader({ rows }: Props) {
  const metrics = useMemo(() => {
    const revenue = rows.reduce((a, r) => a + r.price * r.qty, 0);
    const units = rows.reduce((a, r) => a + r.qty, 0);
    const avgPrice = units ? revenue / units : 0;
    return { revenue, units, avgPrice };
  }, [rows]);

  return (
    <div>
      <span data-test="kpi-revenue">Revenue: {metrics.revenue.toFixed(2)}</span>
      <span data-test="kpi-units"> Units: {metrics.units}</span>
      <span data-test="kpi-avg"> Avg Price: {metrics.avgPrice.toFixed(2)}</span>
    </div>
  );
}
