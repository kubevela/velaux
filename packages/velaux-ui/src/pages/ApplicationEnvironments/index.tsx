import { Button } from '@alifd/next';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { useState } from 'react';
import { AiOutlineEnvironment } from 'react-icons/ai';

import type { ApplicationDetail, EnvBinding } from '@velaux/data';
import Empty from '../../components/Empty';
import { If } from '../../components/If';
import Permission from '../../components/Permission';
import { Chip, ResourceCard, ResourceGrid } from '../../components/ResourceCard';
import { Translation } from '../../components/Translation';
import AddAndEditEnvBind from '../../layout/Application/components/AddAndEditEnvBind';
import { beautifyTime } from '../../utils/common';
import type { EnvironmentStatus } from '../ApplicationList/components/AppStatus/health';
import { healthLabels, summariseStatuses, workflowLabel } from '../ApplicationList/components/AppStatus/health';

type Props = {
  applicationDetail?: ApplicationDetail;
  envbinding?: EnvBinding[];
  applicationAllStatus?: EnvironmentStatus[];
  dispatch: (action: any) => void;
};

// ApplicationEnvironments lists the envs an application is bound to, each as a card
// of its health that opens the env's live view.
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
      <OrbitCards
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

// OrbitCards shows each env an application is bound to as a card of its
// health, opening the env's live view.
export const OrbitCards = (props: {
  appName: string;
  envbinding: EnvBinding[];
  applicationAllStatus: EnvironmentStatus[];
  dispatch: (action: any) => void;
}) => {
  const { appName, envbinding, applicationAllStatus, dispatch } = props;
  const summary = summariseStatuses(applicationAllStatus);
  return (
    <ResourceGrid>
      {envbinding.map((binding) => {
        const env = summary.envs?.find((e) => e.env === binding.name);
        const health = env?.health || 'undeployed';
        const open = () => dispatch(routerRedux.push(`/applications/${appName}/envbinding/${binding.name}/status`));
        return (
          <ResourceCard
            key={binding.name}
            tone={health}
            badge={healthLabels[health]}
            icon={<AiOutlineEnvironment />}
            title={binding.alias || binding.name}
            subtitle={binding.alias && binding.alias !== binding.name ? binding.name : undefined}
            onOpen={open}
            description={
              env
                ? `${env.healthyComponents}/${env.components} components healthy` +
                  (env.workflow ? `, workflow ${workflowLabel(env.workflow).toLowerCase()}` : '')
                : binding.description || 'Not deployed yet'
            }
            chips={
              binding.targetNames?.length ? (
                <React.Fragment>
                  {binding.targetNames.map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
                </React.Fragment>
              ) : undefined
            }
            footLeft={binding.createTime && `Bound ${beautifyTime(binding.createTime)}`}
            footRight={
              <a onClick={open}>
                <Translation>Open</Translation>
              </a>
            }
          />
        );
      })}
    </ResourceGrid>
  );
};
