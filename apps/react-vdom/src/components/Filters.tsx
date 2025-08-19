import React from 'react';

interface Props {
  region: string;
  timeframe: string;
  onRegionChange(r: string): void;
  onTimeframeChange(t: string): void;
}

export default function Filters({ region, timeframe, onRegionChange, onTimeframeChange }: Props) {
  return (
    <div>
      <select data-test="filter-region" value={region} onChange={e => onRegionChange(e.target.value)}>
        <option data-test="option-us" value="US">US</option>
        <option data-test="option-eu" value="EU">EU</option>
        <option data-test="option-apac" value="APAC">APAC</option>
      </select>
      <select data-test="filter-timeframe" value={timeframe} onChange={e => onTimeframeChange(e.target.value)}>
        <option data-test="7d" value="7d">7d</option>
        <option data-test="30d" value="30d">30d</option>
        <option data-test="90d" value="90d">90d</option>
      </select>
    </div>
  );
}
