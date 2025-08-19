import React from 'react';

interface Props { logs: string[]; }

export default function ActivityLog({ logs }: Props) {
  return (
    <ul data-test="activity-log">
      {logs.map((l, i) => (
        <li key={i}>{l}</li>
      ))}
    </ul>
  );
}
