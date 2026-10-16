import { connect } from 'dva';
import { Link } from 'dva/router';
import React from 'react';
import { AiOutlineArrowLeft } from 'react-icons/ai';

import type { EnvBinding } from '@velaux/data';
import { StatusBadge } from '../../../../components/StatusBadge';
import i18n from '../../../../i18n';
import { Translation } from '../../../../components/Translation';
import type { EnvironmentStatus } from '../../../../pages/ApplicationList/components/AppStatus/health';
import {
  healthLabels,
  pausedEnvs,
  summariseStatuses,
} from '../../../../pages/ApplicationList/components/AppStatus/health';
import './index.less';

type Tab = { key: string; label: string; to: string; active: (path: string) => boolean };

// appTabs are the application page's tabs, in the order a reader builds an
// application up: what it reads, what it runs, its rules, what starts it, then
// how it is delivered and where.
export function appTabs(appName: string): Tab[] {
  const base = `/applications/${appName}`;
  const config = (section: string) => ({
    to: `${base}/config/${section}`,
    active: (path: string) => path.startsWith(`${base}/config/${section}`),
  });
  return [
    { key: 'overview', label: 'Overview', to: `${base}/config`, active: (path) => path === `${base}/config` },
    { key: 'sources', label: 'Sources', ...config('sources') },
    { key: 'components', label: 'Components', ...config('components') },
    { key: 'policies', label: 'Policies', ...config('policies') },
    { key: 'triggers', label: 'Triggers', ...config('triggers') },
    {
      key: 'workflows',
      label: 'Workflows',
      to: `${base}/workflows`,
      active: (path) => path.startsWith(`${base}/workflows`),
    },
    {
      key: 'environments',
      label: 'Environments',
      to: `${base}/environments`,
      active: (path) => path.startsWith(`${base}/environments`) || path.startsWith(`${base}/envbinding`),
    },
    {
      key: 'revisions',
      label: 'Revisions',
      to: `${base}/revisions`,
      active: (path) => path.startsWith(`${base}/revisions`),
    },
  ];
}

// AppTabs is the application page's one row of tabs.
export const AppTabs = (props: { appName: string; currentPath: string }) => (
  <div className="app-tabs" role="tablist">
    {appTabs(props.appName).map((tab) => (
      <Link
        key={tab.key}
        role="tab"
        aria-selected={tab.active(props.currentPath)}
        className={`app-tab ${tab.active(props.currentPath) ? 'active' : ''}`}
        to={tab.to}
      >
        <Translation>{tab.label}</Translation>
      </Link>
    ))}
  </div>
);

// EnvironmentBar heads one env's live view: back to all of them, the env's health,
// and its views.
const EnvironmentBarView = (props: {
  appName: string;
  envName: string;
  currentPath: string;
  envbinding?: EnvBinding[];
  applicationAllStatus?: EnvironmentStatus[];
}) => {
  const { appName, envName, currentPath } = props;
  const binding = props.envbinding?.find((e) => e.name === envName);
  const env = summariseStatuses(props.applicationAllStatus || []).envs?.find((e) => e.env === envName);
  const health = env?.health || 'undeployed';
  const base = `/applications/${appName}/envbinding/${envName}`;
  const views = [
    { key: 'status', label: 'Status' },
    { key: 'instances', label: 'Instances' },
    { key: 'logs', label: 'Logs' },
    { key: 'workflow', label: 'Workflow' },
  ];
  return (
    <div className="environment-bar">
      <Link className="environment-bar-back" to={`/applications/${appName}/environments`}>
        <AiOutlineArrowLeft />
        <Translation>All Environments</Translation>
      </Link>
      <span className="environment-bar-name">{binding?.alias || envName}</span>
      <StatusBadge tone={health} label={healthLabels[health]} />
      {pausedEnvs(props.applicationAllStatus || []).includes(envName) && (
        <StatusBadge tone="suspended" label="Paused" title={i18n.t('Reconciliation paused').toString()} />
      )}
      <div className="environment-bar-views">
        {views.map((v) => (
          <Link
            key={v.key}
            to={`${base}/${v.key}`}
            className={`environment-view ${currentPath.startsWith(`${base}/${v.key}`) ? 'active' : ''}`}
          >
            <Translation>{v.label}</Translation>
          </Link>
        ))}
      </div>
    </div>
  );
};

// EnvironmentBar reads the env's status from the store, so it updates as it loads.
export const EnvironmentBar = connect((store: any) => ({
  envbinding: store.application.envbinding,
  applicationAllStatus: store.application.applicationAllStatus,
}))(EnvironmentBarView);
