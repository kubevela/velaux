import { connect } from 'dva';
import { Link } from 'dva/router';
import React from 'react';
import { AiOutlineArrowLeft, AiOutlinePlus } from 'react-icons/ai';

import type { EnvBinding } from '@velaux/data';
import { StatusBadge } from '../../../../components/StatusBadge';
import i18n from '../../../../i18n';
import { Translation } from '../../../../components/Translation';
import type { EnvironmentStatus } from '../../../../pages/ApplicationList/components/AppStatus/health';
import {
  envPhase,
  healthLabels,
  pausedEnvs,
  phaseLabel,
  phaseTone,
  summariseStatuses,
} from '../../../../pages/ApplicationList/components/AppStatus/health';
import { addLink, environmentViews, tabRuns, tabsReadOnly } from './add';
import { environmentSlots } from '../../../../components/EnvironmentSlot';
import './index.less';

// A tab may sit in a labelled group; one that can add has a + that opens its
// add dialog.
type Tab = {
  key: string;
  label: string;
  to: string;
  active: (path: string) => boolean;
  group?: string;
  canAdd?: boolean;
};

// appTabs are the application page's tabs, in the order a reader builds an
// application up: what it reads, what it runs, its rules, what starts it, then
// how it is delivered and where.
export function appTabs(appName: string): Tab[] {
  const base = `/applications/${appName}`;
  const config = (section: string) => ({
    to: `${base}/config/${section}`,
    active: (path: string) => path.startsWith(`${base}/config/${section}`),
    group: 'Configure',
    canAdd: true,
  });
  return [
    { key: 'overview', label: 'Overview', to: `${base}/config`, active: (path) => path === `${base}/config` },
    { key: 'sources', label: 'Sources', ...config('sources') },
    { key: 'components', label: 'Components', ...config('components') },
    { key: 'policies', label: 'Policies', ...config('policies') },
    { key: 'triggers', label: 'Triggers', ...config('triggers') },
    {
      key: 'workflows',
      group: 'Deploy',
      label: 'Workflows',
      to: `${base}/workflows`,
      active: (path) => path.startsWith(`${base}/workflows`),
    },
    {
      key: 'environments',
      group: 'Deploy',
      label: 'Environments',
      to: `${base}/environments`,
      active: (path) => path.startsWith(`${base}/environments`) || path.startsWith(`${base}/envbinding`),
    },
    {
      key: 'revisions',
      group: 'Deploy',
      label: 'Revisions',
      to: `${base}/revisions`,
      active: (path) => path.startsWith(`${base}/revisions`),
    },
  ];
}

// AppTabsView is the application page's one row of tabs. Tabs that share a
// group sit together under its label; those that can add have a + unless the
// application is read-only.
const AppTabsView = (props: { appName: string; currentPath: string; readOnly: boolean }) => {
  const tab = (t: Tab) => (
    <Link
      key={t.key}
      role="tab"
      aria-selected={t.active(props.currentPath)}
      className={`app-tab ${t.active(props.currentPath) ? 'active' : ''}`}
      to={t.to}
    >
      <Translation>{t.label}</Translation>
    </Link>
  );
  const withAdd = (t: Tab) =>
    t.canAdd && !props.readOnly ? (
      <span key={t.key} className="app-tab-with-add">
        {tab(t)}
        <Link
          className="app-tab-add"
          to={addLink(t.to)}
          title={i18n.t('Add').toString()}
          aria-label={`${i18n.t('Add').toString()} ${i18n.t(t.label).toString()}`}
        >
          <AiOutlinePlus />
        </Link>
      </span>
    ) : (
      tab(t)
    );
  return (
    <div className="app-tabs" role="tablist">
      {tabRuns(appTabs(props.appName)).map((run) =>
        run.group ? (
          <div key={run.group} className="app-tab-group" role="group" aria-label={i18n.t(run.group).toString()}>
            <span className="app-tab-group-label">
              <Translation>{run.group}</Translation>
            </span>
            <div className="app-tab-group-tabs">{run.tabs.map(withAdd)}</div>
          </div>
        ) : (
          run.tabs.map(withAdd)
        )
      )}
    </div>
  );
};

// AppTabs reads whether the application is read-only from the store, as the
// layout does not re-render when its details load.
export const AppTabs = connect((store: any, own: { appName: string }) => ({
  readOnly: tabsReadOnly(store.application.applicationDetail, own.appName),
}))(AppTabsView);

// EnvironmentBar heads one env's live view: back to all of them, the env's health
// and phase, and one row of its views.
const EnvironmentBarView = (props: {
  appName: string;
  envName: string;
  currentPath: string;
  envbinding?: EnvBinding[];
  applicationAllStatus?: EnvironmentStatus[];
}) => {
  const { appName, envName, currentPath } = props;
  const binding = props.envbinding?.find((e) => e.name === envName);
  const statuses = props.applicationAllStatus || [];
  const env = summariseStatuses(statuses).envs?.find((e) => e.env === envName);
  const health = env?.health || 'undeployed';
  const phase = envPhase(statuses, envName);
  const base = `/applications/${appName}/envbinding/${envName}`;
  return (
    <div className="environment-bar">
      <div className="environment-bar-head">
        <Link className="environment-bar-back" to={`/applications/${appName}/environments`}>
          <AiOutlineArrowLeft />
          <Translation>All Environments</Translation>
        </Link>
        <span className="environment-bar-name">{binding?.alias || envName}</span>
        <StatusBadge tone={health} label={healthLabels[health]} />
        {phase && (
          <StatusBadge
            tone={phaseTone(phase)}
            label={phaseLabel(phase)}
            title={i18n.t('Application phase').toString()}
          />
        )}
        {pausedEnvs(statuses).includes(envName) && (
          <StatusBadge tone="suspended" label="Paused" title={i18n.t('Reconciliation paused').toString()} />
        )}
        <div className="environment-bar-filters" id={environmentSlots.filters} />
      </div>
      <div className="environment-bar-tabs" role="tablist">
        {environmentViews(base).map((v) => (
          <Link
            key={v.key}
            role="tab"
            aria-selected={v.active(currentPath)}
            to={v.to}
            className={`environment-view ${v.active(currentPath) ? 'active' : ''}`}
          >
            <Translation>{v.label}</Translation>
          </Link>
        ))}
        <div className="environment-bar-actions" id={environmentSlots.actions} />
      </div>
    </div>
  );
};

// EnvironmentBar reads the env's status from the store, so it updates as it loads.
export const EnvironmentBar = connect((store: any) => ({
  envbinding: store.application.envbinding,
  applicationAllStatus: store.application.applicationAllStatus,
}))(EnvironmentBarView);
