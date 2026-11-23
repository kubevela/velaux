import { Button, Message, Dialog } from '@alifd/next';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import i18n from 'i18next';
import React, { Component } from 'react';
import { syncInfo } from '../../../../utils/appMeta';
import { PageHeader } from '../../../../components/PageHeader';
import { StatusBadge } from '../../../../components/StatusBadge';
import type { EnvironmentStatus } from '../../../../pages/ApplicationList/components/AppStatus/health';
import {
  healthLabels,
  changedOutsideEnvs,
  pausedEnvs,
  summariseStatuses,
} from '../../../../pages/ApplicationList/components/AppStatus/health';

import { deployApplication } from '../../../../api/application';
import { notifyDeployed } from '../../../../utils/deploy';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import type {
  ApplicationDetail,
  ApplicationStatistics,
  Workflow,
  WorkflowRecord,
  ApplicationDeployResponse,
  ApplicationEnvStatus,
  EnvBinding,
} from '@velaux/data';
import type { APIError } from '../../../../utils/errors';
import { handleError } from '../../../../utils/errors';
import { locale } from '../../../../utils/locale';
import DeployConfig from '../DeployConfig';
import { Dispatch } from 'redux';

interface Props {
  currentPath: string;
  appName: string;
  envName?: string;
  applicationDetail?: ApplicationDetail;
  applicationAllStatus?: ApplicationEnvStatus[];
  workflows?: Workflow[];
  envbinding?: EnvBinding[];
  dispatch: Dispatch;
}

interface State {
  loading: boolean;
  statistics?: ApplicationStatistics;
  records?: WorkflowRecord[];
  showDeployConfig: boolean;
}

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationHeader extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      loading: false,
      showDeployConfig: false,
    };
  }

  onDeployConfig = () => {
    this.loadApplicationStatus();
    this.setState({ showDeployConfig: true });
  };

  loadApplicationStatus = async () => {
    const { appName, dispatch } = this.props;
    this.setState({ loading: true });
    dispatch({
      type: 'application/getApplicationAllStatus',
      payload: { appName: appName },
      callback: () => {
        this.setState({ loading: false });
      },
    });
  };

  onGetApplicationDetails = async () => {
    const { appName, dispatch } = this.props;
    if (dispatch && appName) {
      dispatch({
        type: 'application/getApplicationDetail',
        payload: { appName: appName },
      });
    }
  };

  // onDeploy deploys a workflow.
  onDeploy = (workflowName?: string, force?: boolean) => {
    const { applicationDetail } = this.props;
    // The first deploy from here takes over an app applied outside VelaUX, so ask first.
    if (!force && syncInfo(applicationDetail?.labels).fromCluster) {
      Dialog.confirm({
        title: i18n.t('Take over this application?').toString(),
        content: i18n
          .t(
            'This application was applied outside VelaUX. Deploying from here makes VelaUX its source of truth: VelaUX pins the deployed version, so later changes made with kubectl or GitOps are accepted but not rolled out until they are deployed from VelaUX.'
          )
          .toString(),
        onOk: () => this.onDeployUnpaused(workflowName, force),
        style: { width: 520 },
        locale: locale().Dialog,
      });
      return;
    }
    this.onDeployUnpaused(workflowName, force);
  };

  // onDeployUnpaused asks first when the workflow's env is paused, since the deploy is written but does not roll out
  // until a resume.
  onDeployUnpaused = (workflowName?: string, force?: boolean) => {
    const { workflows, applicationAllStatus } = this.props;
    const envName = workflows?.find((w) => w.name === workflowName)?.envName;
    if (!force && envName && pausedEnvs((applicationAllStatus || []) as EnvironmentStatus[]).includes(envName)) {
      Dialog.confirm({
        content: i18n
          .t(
            'Reconciliation is paused in this environment: the deploy is written but does not roll out until you resume.'
          )
          .toString(),
        onOk: () => this.deploy(workflowName, force),
        locale: locale().Dialog,
      });
      return;
    }
    this.deploy(workflowName, force);
  };

  deploy = (workflowName?: string, force?: boolean) => {
    const { applicationDetail, dispatch } = this.props;
    if (applicationDetail) {
      deployApplication(
        {
          appName: applicationDetail.name,
          workflowName: workflowName,
          triggerType: 'web',
          force: force || false,
        },
        true
      )
        .then((re: ApplicationDeployResponse) => {
          if (re) {
            notifyDeployed(re);
            this.onGetApplicationDetails();
            if (re.record && re.record.name && dispatch) {
              dispatch(
                routerRedux.push(
                  `/applications/${applicationDetail.name}/envbinding/${re.envName}/workflow/records/${re.record.name}`
                )
              );
            }
          }
        })
        .catch((err: APIError) => {
          if (err.BusinessCode === 10004) {
            Dialog.confirm({
              content: i18n.t('Workflow is executing. Do you want to force a restart?').toString(),
              onOk: () => {
                this.onDeploy(workflowName, true);
              },
              locale: locale().Dialog,
            });
          } else {
            handleError(err);
          }
        });
    } else {
      Message.warning('Please wait');
    }
  };

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    const { applicationDetail, applicationAllStatus, workflows, envbinding, appName, envName, dispatch } = this.props;
    const { showDeployConfig, loading } = this.state;
    const summary = summariseStatuses((applicationAllStatus || []) as EnvironmentStatus[]);
    const paused = pausedEnvs((applicationAllStatus || []) as EnvironmentStatus[]);
    const changedOutside = changedOutsideEnvs((applicationAllStatus || []) as EnvironmentStatus[]);
    const projectName = (applicationDetail && applicationDetail.project?.name) || '';
    return (
      <div>
        <PageHeader
          breadcrumb={[
            {
              to: '/projects/' + projectName + '/applications',
              title: applicationDetail?.project?.alias || projectName,
            },
            {
              to: `/applications/${applicationDetail?.name || ''}`,
              title: (applicationDetail && (applicationDetail.alias || applicationDetail.name)) || '',
            },
          ]}
          title={applicationDetail?.alias || applicationDetail?.name}
          actions={
            <Permission
              request={{
                resource: `project:${projectName}/application:${applicationDetail && applicationDetail.name}`,
                action: 'deploy',
              }}
              project={projectName}
            >
              <Button type="primary" disabled={applicationDetail?.readOnly} onClick={() => this.onDeployConfig()}>
                <Translation>Deploy</Translation>
              </Button>
            </Permission>
          }
        >
          <StatusBadge tone={summary.health} label={healthLabels[summary.health]} />
          {paused.length > 0 && (
            <StatusBadge
              tone="suspended"
              label="Paused"
              title={`${i18n.t('Reconciliation paused in')} ${paused.join(', ')}`}
            />
          )}
          {changedOutside.length > 0 && (
            <StatusBadge
              tone="suspended"
              label="Changed outside VelaUX"
              title={`${i18n.t(
                'The Application changed after its last deploy from VelaUX and the change is not rolled out, in'
              )} ${changedOutside.join(', ')}. ${i18n.t('Deploy from VelaUX to roll out what VelaUX holds.')}`}
            />
          )}
          {applicationDetail?.readOnly && (
            <StatusBadge
              tone="neutral"
              label="Read-only"
              title={i18n.t('Managed by its addon: change it from the Addons page.').toString()}
            />
          )}
          {syncInfo(applicationDetail?.labels).fromCluster && (
            <StatusBadge
              tone="neutral"
              label="Synced from cluster"
              title={i18n
                .t(
                  'Managed as an Application in the cluster: VelaUX picks up its changes. Deploying from here makes VelaUX its source of truth.'
                )
                .toString()}
            />
          )}
          {summary.components > 0 && (
            <span className="page-head-meta">
              {summary.healthyComponents}/{summary.components} <Translation>components healthy</Translation>
            </span>
          )}
        </PageHeader>
        <If condition={showDeployConfig}>
          {applicationDetail && envbinding && workflows && (
            <DeployConfig
              loading={loading}
              envName={envName}
              applicationAllStatus={applicationAllStatus}
              applicationDetail={applicationDetail}
              envBindings={envbinding}
              onClose={() => {
                this.setState({ showDeployConfig: false });
              }}
              dispatch={dispatch}
              appName={appName}
              onOK={this.onDeploy}
              workflows={workflows}
            />
          )}
        </If>
      </div>
    );
  }
}

export default ApplicationHeader;
