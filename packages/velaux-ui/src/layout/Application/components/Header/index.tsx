import { Grid, Button, Message, Dialog } from '@alifd/next';
import classNames from 'classnames';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import i18n from 'i18next';
import React, { Component } from 'react';
import { Breadcrumb } from '../../../../components/Breadcrumb';

import { deployApplication } from '../../../../api/application';
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

const { Row, Col } = Grid;

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
            Message.success(i18n.t('Application deployed successfully'));
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
    const { applicationDetail, applicationAllStatus, currentPath, workflows, envbinding, appName, envName, dispatch } =
      this.props;
    const { showDeployConfig, loading } = this.state;
    const activeKey = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    let item = <Translation>{`app-${activeKey}`}</Translation>;
    const projectName = (applicationDetail && applicationDetail.project?.name) || '';
    const sourceOfTrust = applicationDetail?.labels && applicationDetail?.labels['app.oam.dev/source-of-truth'];
    const envPage = currentPath.startsWith(`/applications/${appName}/envbinding/`);
    if (envPage) {
      item = <Translation>{`Environment`}</Translation>;
    }
    return (
      <div>
        <Row>
          <Col span={6} className={classNames('padding16')}>
            <Breadcrumb
              items={[
                {
                  to: '/projects/' + projectName + '/applications',
                  title: projectName,
                },
                {
                  to: `/applications/${applicationDetail?.name || ''}`,
                  title: (applicationDetail && (applicationDetail.alias || applicationDetail.name)) || '',
                },
                {
                  title: item,
                },
              ]}
            />
          </Col>
          <Col span={18} className="flexright" style={{ padding: '0 16px' }}>
            <If condition={applicationDetail?.readOnly}>
              <Message
                type="notice"
                title={i18n.t('This application is managed by the addon, and it is readonly').toString()}
              />
            </If>
            <If condition={sourceOfTrust === 'from-k8s-resource'}>
              <Message type="warning" title={i18n.t('The application is synchronizing from the cluster.').toString()} />
            </If>
            <Permission
              request={{
                resource: `project:${projectName}/application:${applicationDetail && applicationDetail.name}`,
                action: 'deploy',
              }}
              project={projectName}
            >
              <Button
                style={{ marginLeft: '16px' }}
                type="primary"
                disabled={applicationDetail?.readOnly}
                onClick={() => this.onDeployConfig()}
              >
                <Translation>Deploy</Translation>
              </Button>
            </Permission>
          </Col>
        </Row>
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
