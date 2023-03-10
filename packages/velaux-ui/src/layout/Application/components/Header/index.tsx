import { Grid, Breadcrumb, Button, Message, Dialog, Icon } from '@alifd/next';
import classNames from 'classnames';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import i18n from 'i18next';
import React, { Component } from 'react';
import { AiOutlineHome } from 'react-icons/ai';

import { deployApplication } from '../../../../api/application';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import Translation from '../../../../components/Translation';
import type {
  ApplicationDetail,
  ApplicationStatus,
  ApplicationStatistics,
  Workflow,
  WorkflowRecord,
  ApplicationDeployResponse,
} from '../../../../interface/application';
import type { APIError } from '../../../../utils/errors';
import { handleError } from '../../../../utils/errors';
import locale from '../../../../utils/locale';
import DeployConfig from '../DeployConfig';

const { Row, Col } = Grid;

interface Props {
  currentPath: string;
  appName: string;
  applicationDetail?: ApplicationDetail;
  applicationStatus?: { status?: ApplicationStatus };
  workflows?: Workflow[];
  dispatch?: (params: any) => void;
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
      loading: true,
      showDeployConfig: false,
    };
  }

  onDeployConfig = () => {
    this.setState({ showDeployConfig: true });
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
            Message.success('Application deployed successfully');
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
    const { applicationDetail, currentPath, workflows, appName } = this.props;
    const { showDeployConfig } = this.state;
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
          <Col span={6} className={classNames('padding16', 'breadcrumb')}>
            <Link to={'/'}>
              <AiOutlineHome size={18} />
            </Link>
            <Breadcrumb separator="/">
              <Breadcrumb.Item>
                <Link to={'/projects/' + projectName}>{projectName}</Link>
              </Breadcrumb.Item>

              <Breadcrumb.Item>
                <Link to={`/projects/${projectName}/applications`}>
                  <Translation>Applications</Translation>
                </Link>
              </Breadcrumb.Item>

              <Breadcrumb.Item>
                <Link to={`/applications/${applicationDetail?.name || ''}`}>
                  {applicationDetail && (applicationDetail.alias || applicationDetail.name)}
                </Link>
              </Breadcrumb.Item>

              <Breadcrumb.Item>{item}</Breadcrumb.Item>
            </Breadcrumb>
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
          {applicationDetail && (
            <DeployConfig
              applicationDetail={applicationDetail}
              onClose={() => {
                this.setState({ showDeployConfig: false });
              }}
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
