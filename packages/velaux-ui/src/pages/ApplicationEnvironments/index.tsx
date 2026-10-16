import { Button } from '@alifd/next';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { useState } from 'react';
import { RelativeTime } from '../../components/RelativeTime';
import { AiOutlineDown, AiOutlineEnvironment, AiOutlineEye, AiOutlineRight } from 'react-icons/ai';

import type { ApplicationDetail, EnvBinding } from '@velaux/data';
import Empty from '../../components/Empty';
import { If } from '../../components/If';
import Permission from '../../components/Permission';
import { Chip } from '../../components/ResourceCard';
import { RowAction } from '../../components/RowAction';
import '../../components/RowList';
import { StatusBadge } from '../../components/StatusBadge';
import { Translation } from '../../components/Translation';
import AddAndEditEnvBind from '../../layout/Application/components/AddAndEditEnvBind';
import type { EnvironmentStatus } from '../ApplicationList/components/AppStatus/health';
import {
  healthLabels,
  pausedEnvs,
  summariseStatuses,
  workflowLabel,
} from '../ApplicationList/components/AppStatus/health';
import './index.less';

type Props = {
  applicationDetail?: ApplicationDetail;
  envbinding?: EnvBinding[];
  applicationAllStatus?: EnvironmentStatus[];
  dispatch: (action: any) => void;
};

// ApplicationEnvironments lists the envs an application is bound to, each opening the
// env's live view.
const ApplicationEnvironments = (props: Props) => {
  const { applicationDetail, envbinding = [], applicationAllStatus = [], dispatch } = props;
  const [adding, setAdding] = useState(false);
  const appName = applicationDetail?.name || '';
  const projectName = applicationDetail?.project?.name || '';
  const reload = () => {
    dispatch({ type: 'application/getApplicationEnvbinding', payload: { appName } });
    dispatch({ type: 'application/getApplicationWorkflows', payload: { appName } });
    dispatch({ type: 'application/getApplicationPolicies', payload: { appName } });
    dispatch({ type: 'application/getApplicationAllStatus', payload: { appName } });
  };
  return (
    <div>
      <div className="flexright" style={{ marginBottom: '16px' }}>
        <If condition={!applicationDetail?.readOnly}>
          <Permission
            request={{ resource: `project:${projectName}/application:${appName}/envBinding:*`, action: 'create' }}
            project={projectName}
          >
            <Button type="primary" onClick={() => setAdding(true)}>
              <Translation>Add Environment</Translation>
            </Button>
          </Permission>
        </If>
      </div>
      <If condition={envbinding.length === 0}>
        <Empty message={<Translation>This application is not bound to an environment yet</Translation>} />
      </If>
      <EnvironmentList
        appName={appName}
        envbinding={envbinding}
        applicationAllStatus={applicationAllStatus}
        dispatch={dispatch}
      />
      <If condition={adding}>
        <AddAndEditEnvBind
          envbinding={envbinding}
          onClose={() => setAdding(false)}
          onOK={() => {
            reload();
            setAdding(false);
          }}
        />
      </If>
    </div>
  );
};

export default connect((store: any) => ({ ...store.application }))(ApplicationEnvironments);

// EnvironmentList lists the envs an application is bound to as rows of their
// health, each expanding to its targets; its name opens the env's live view.
export const EnvironmentList = (props: {
  appName: string;
  envbinding: EnvBinding[];
  applicationAllStatus: EnvironmentStatus[];
  dispatch: (action: any) => void;
}) => {
  const { appName, envbinding, applicationAllStatus, dispatch } = props;
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const summary = summariseStatuses(applicationAllStatus);
  const paused = pausedEnvs(applicationAllStatus);
  const toggle = (name: string) => setOpen({ ...open, [name]: !open[name] });
  if (envbinding.length === 0) {
    return null;
  }
  return (
    <div className="row-list environment-list">
      <div className="row-list-head">
        <span />
        <span>
          <Translation>Name</Translation>
        </span>
        <span>
          <Translation>Health</Translation>
        </span>
        <span>
          <Translation>Components</Translation>
        </span>
        <span>
          <Translation>Workflow</Translation>
        </span>
        <span>
          <Translation>Targets</Translation>
        </span>
        <span />
      </div>
      {envbinding.map((binding) => {
        const env = summary.envs?.find((e) => e.env === binding.name);
        const health = env?.health || 'undeployed';
        const expanded = !!open[binding.name];
        const view = () => dispatch(routerRedux.push(`/applications/${appName}/envbinding/${binding.name}/status`));
        return (
          <div key={binding.name} className={`row-list-row ${expanded ? 'expanded' : ''}`}>
            <div className="row-list-main">
              <span className="row-list-chevron" onClick={() => toggle(binding.name)}>
                {expanded ? <AiOutlineDown /> : <AiOutlineRight />}
              </span>
              <span className="row-list-name" onClick={() => toggle(binding.name)}>
                <AiOutlineEnvironment className="row-list-icon" />
                <span>
                  <Link
                    className="row-list-title environment-list-link"
                    to={`/applications/${appName}/envbinding/${binding.name}/status`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {binding.alias || binding.name}
                  </Link>
                  {binding.alias && binding.alias !== binding.name && (
                    <span className="row-list-type">{binding.name}</span>
                  )}
                </span>
              </span>
              <span className="environment-list-health">
                <StatusBadge tone={health} label={healthLabels[health]} />
                {paused.includes(binding.name) && <StatusBadge tone="suspended" label="Paused" />}
              </span>
              <span>
                {env ? `${env.healthyComponents}/${env.components}` : <span className="row-list-muted">-</span>}
              </span>
              <span>
                {env?.workflow ? (
                  <Translation>{workflowLabel(env.workflow)}</Translation>
                ) : (
                  <span className="row-list-muted">-</span>
                )}
              </span>
              <span className="environment-list-targets">
                {(binding.targetNames || []).map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </span>
              <span className="row-list-actions">
                <RowAction icon={<AiOutlineEye />} label="Open" onClick={view} />
              </span>
            </div>
            {expanded && (
              <div className="row-list-detail">
                {binding.description && <p className="row-list-description">{binding.description}</p>}
                <div className="row-list-detail-grid">
                  <div>
                    <div className="row-list-detail-title">
                      <Translation>Targets</Translation>
                    </div>
                    {(binding.targets || []).length === 0 ? (
                      <span className="row-list-muted">
                        <Translation>No targets</Translation>
                      </span>
                    ) : (
                      <dl className="row-list-properties">
                        {(binding.targets || []).map((t) => (
                          <React.Fragment key={t.name}>
                            <dt>{t.alias || t.name}</dt>
                            <dd>
                              {[t.clusterAlias || t.cluster?.clusterName, t.cluster?.namespace]
                                .filter(Boolean)
                                .join(' / ')}
                            </dd>
                          </React.Fragment>
                        ))}
                      </dl>
                    )}
                  </div>
                  <div>
                    <div className="row-list-detail-title">
                      <Translation>Deployment</Translation>
                    </div>
                    <dl className="row-list-properties">
                      <dt>
                        <Translation>Application</Translation>
                      </dt>
                      <dd>{`${binding.appDeployNamespace}/${binding.appDeployName}`}</dd>
                      <dt>
                        <Translation>Workflow</Translation>
                      </dt>
                      <dd>{binding.workflow?.alias || binding.workflow?.name || '-'}</dd>
                      {binding.createTime && (
                        <React.Fragment>
                          <dt>
                            <Translation>Bound</Translation>
                          </dt>
                          <dd>
                            <RelativeTime time={binding.createTime} />
                          </dd>
                        </React.Fragment>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
