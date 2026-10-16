import type { ApplicationStatusSummary } from '@velaux/data';
import React from 'react';

import { StatusBadge } from '../../../../components/StatusBadge';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';

import { componentRatio, healthLabels, healthOf, workflowLabel } from './health';
import './index.less';

// HealthBadge is an application's health as a coloured pill.
export const HealthBadge = (props: { status?: ApplicationStatusSummary }) => {
  const health = healthOf(props.status);
  return <StatusBadge tone={health} label={healthLabels[health]} />;
};

// WorkflowBadge is the phase of the workflow behind the health, if one ran.
export const WorkflowBadge = (props: { status?: ApplicationStatusSummary }) => {
  const phase = props.status?.workflow;
  if (!phase) {
    return null;
  }
  return (
    <span className={`app-workflow app-workflow-${phase}`} title={i18n.t('Workflow').toString()}>
      <Translation>Workflow</Translation>: <Translation>{workflowLabel(phase)}</Translation>
    </span>
  );
};

// ComponentHealth is the components healthy out of those deployed, as a bar.
export const ComponentHealth = (props: { status?: ApplicationStatusSummary; compact?: boolean }) => {
  const ratio = componentRatio(props.status);
  if (ratio === undefined || !props.status) {
    return (
      <span className="app-components-none">
        <Translation>No components deployed</Translation>
      </span>
    );
  }
  const { components, healthyComponents } = props.status;
  return (
    <div className={`app-components ${props.compact ? 'compact' : ''}`}>
      <div className="app-components-text">
        <span>
          {components} <Translation>{components === 1 ? 'Component' : 'Components'}</Translation>
        </span>
        <span className="app-components-count">
          {healthyComponents}/{components} <Translation>healthy</Translation>
        </span>
      </div>
      <div className="app-components-bar">
        <div className={ratio === 1 ? 'full' : 'partial'} style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </div>
  );
};

// EnvHealth lists the envs the application runs in, each with its health.
export const EnvHealth = (props: { status?: ApplicationStatusSummary }) => {
  const envs = props.status?.envs || [];
  if (envs.length === 0) {
    return null;
  }
  return (
    <div className="app-envs">
      {envs.map((e) => (
        <span
          key={e.env}
          className={`app-env tone-${e.health}`}
          title={`${i18n.t(healthLabels[e.health])}: ${e.healthyComponents}/${e.components}`}
        >
          <span className="status-dot" />
          {e.env}
        </span>
      ))}
    </div>
  );
};
