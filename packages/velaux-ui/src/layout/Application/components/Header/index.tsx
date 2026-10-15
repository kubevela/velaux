import { Button, Message, Dialog } from '@alifd/next';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import i18n from 'i18next';
import React, { Component } from 'react';
import { Breadcrumb } from '../../../../components/Breadcrumb';
import { StatusBadge } from '../../../../components/StatusBadge';
import type { EnvironmentStatus } from '../../../../pages/ApplicationList/components/AppStatus/health';
import { healthLabels, summariseStatuses } from '../../../../pages/ApplicationList/components/AppStatus/health';
import './index.less';

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

  onDeploy = (workflowName?: string, force?: boolean) => {
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
    const projectName = (applicationDetail && applicationDetail.project?.name) || '';
    const sourceOfTrust = applicationDetail?.labels && applicationDetail?.labels['app.oam.dev/source-of-truth'];
    return (
      <div>
        <div className="app-head">
          <Breadcrumb
            items={[
              {
                to: '/projects/' + projectName + '/applications',
                title: applicationDetail?.project?.alias || projectName,
              },
              {
                to: `/applications/${applicationDetail?.name || ''}`,
                title: (applicationDetail && (applicationDetail.alias || applicationDetail.name)) || '',
              },
            ]}
          />
          <div className="app-head-main">
            <h1 className="app-head-name">{applicationDetail?.alias || applicationDetail?.name}</h1>
            <StatusBadge tone={summary.health} label={healthLabels[summary.health]} />
            {summary.components > 0 && (
              <span className="app-head-meta">
                {summary.healthyComponents}/{summary.components} <Translation>components healthy</Translation>
              </span>
            )}
            <div className="app-head-actions">
              <If condition={applicationDetail?.readOnly}>
                <Message
                  type="notice"
                  title={i18n.t('This application is managed by the addon, and it is readonly').toString()}
                />
              </If>
              <If condition={sourceOfTrust === 'from-k8s-resource'}>
                <Message
                  type="warning"
                  title={i18n.t('The application is synchronizing from the cluster.').toString()}
                />
              </If>
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
            </div>
          </div>
        </div>
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
