import { Component } from 'solid-js';

interface Props {
  region: () => string;
  timeframe: () => string;
  onRegionChange(r: string): void;
  onTimeframeChange(t: string): void;
}

const Filters: Component<Props> = (props) => (
  <div>
    <select data-test="filter-region" value={props.region()} onInput={e => props.onRegionChange(e.currentTarget.value)}>
      <option data-test="option-us" value="US">US</option>
      <option data-test="option-eu" value="EU">EU</option>
      <option data-test="option-apac" value="APAC">APAC</option>
    </select>
    <select data-test="filter-timeframe" value={props.timeframe()} onInput={e => props.onTimeframeChange(e.currentTarget.value)}>
      <option data-test="7d" value="7d">7d</option>
      <option data-test="30d" value="30d">30d</option>
      <option data-test="90d" value="90d">90d</option>
    </select>
  </div>
);

export default Filters;
