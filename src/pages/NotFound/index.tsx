import React from 'react';
import Group from '../../extends/Group';
import EnvPlan from '../../extends/EnvPlan';
export default function NotFound() {
  return (
    <div>
      <Group title="envplan" description="envplan">
        <EnvPlan clusterList={[]} />
      </Group>
    </div>
  );
}
