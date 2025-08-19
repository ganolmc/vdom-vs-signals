import { Component, For } from 'solid-js';

interface Props { logs: () => string[]; }

const ActivityLog: Component<Props> = (props) => (
  <ul data-test="activity-log">
    <For each={props.logs()}>{(l) => <li>{l}</li>}</For>
  </ul>
);
export default ActivityLog;
