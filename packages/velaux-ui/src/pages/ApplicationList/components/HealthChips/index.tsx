import React from 'react';

import { Translation } from '../../../../components/Translation';
import type { HealthFilter } from '../AppStatus/health';
import { healthLabels } from '../AppStatus/health';
import './index.less';

// order lists the healths worst last, as the badges rank them.
const order: HealthFilter[] = ['all', 'healthy', 'progressing', 'suspended', 'unhealthy', 'failed', 'undeployed'];

// HealthChips filters the application list by health, each chip counting the
// applications in it; a health no application is in is left out.
export const HealthChips = (props: {
  counts: Partial<Record<HealthFilter, number>>;
  value: HealthFilter;
  onChange: (health: HealthFilter) => void;
}) => (
  <div className="health-chips" role="group" aria-label="Filter by health">
    {order
      .filter((h) => h === 'all' || (props.counts[h] || 0) > 0)
      .map((h) => (
        <button
          key={h}
          type="button"
          className={`health-chip tone-${h}${props.value === h ? ' active' : ''}`}
          aria-pressed={props.value === h}
          onClick={() => props.onChange(h)}
        >
          {h !== 'all' && <span className="status-dot" />}
          <Translation>{h === 'all' ? 'All' : healthLabels[h]}</Translation>
          <span className="health-chip-count">{props.counts[h] || 0}</span>
        </button>
      ))}
  </div>
);
