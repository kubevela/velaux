import { Grid, Card, Breadcrumb, Button, Message, Dialog, Icon } from '@b-design/ui';
import { connect } from 'dva';
import React, { Component } from 'react';
import Translation from '../../../../components/Translation';
import {
  deployApplication,
  getApplicationStatistics,
  getApplicationWorkflowRecord,
} from '../../../../api/application';
import type {
  ApplicationDetail,
  ApplicationStatus,
  ApplicationStatistics,
  Workflow,
  WorkflowBase,
} from '../../../../interface/application';
import NumItem from '../../../../components/NumItem';
import { Link } from 'dva/router';
import type { APIError } from '../../../../utils/errors';
import { handleError } from '../../../../utils/errors';
import WorkflowSlider from '../WorkflowSlider';
import { If } from 'tsx-control-statements/components';
import Empty from '../../../../components/Empty';
import locale from '../../../../utils/locale';
import DeployConfig from '../DeployConfig';
import i18n from 'i18next';
import Permission from '../../../../components/Permission';
import classNames from 'classnames';

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
  records?: WorkflowBase[];
  showDeployConfig: boolean;
}

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationHeader extends Component<Props, State> {
  interval: any;
  sync: boolean;
  constructor(props: any) {
    super(props);
    this.state = {
      loading: true,
      showDeployConfig: false,
    };
    this.sync = true;
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
    const { applicationDetail } = this.props;
    if (applicationDetail) {
      deployApplication(
        {
          appName: applicationDetail.name,
          workflowName: workflowName,
          triggerType: 'web',
          force: force || false,
        },
        true,
      )
        .then((re) => {
          if (re) {
            Message.success('Application deployed successfully');
            this.onGetApplicationDetails();
          }
        })
        .catch((err: APIError) => {
          if (err.BusinessCode === 10004) {
            Dialog.confirm({
              content: i18n.t('Workflow is executing. Do you want to force a restart?'),
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

  loadAppStatistics = async () => {
    const { appName } = this.props;
    if (appName) {
      getApplicationStatistics({ appName: appName }).then((re: ApplicationStatistics) => {
        if (re) {
          this.setState({ statistics: re });
        }
      });
    }
  };

  loadWorkflowRecord = async () => {
    const { appName } = this.props;
    if (appName) {
      getApplicationWorkflowRecord({ appName: appName })
        .then((re) => {
          if (re) {
            this.setState({ records: re.records });
          }
        })
        .finally(() => {
          if (this.sync) {
            this.interval = setTimeout(() => {
              this.loadWorkflowRecord();
            }, 3000);
          }
        });
    }
  };

  componentDidMount() {
    this.loadAppStatistics();
    this.loadWorkflowRecord();
  }

  componentWillUnmount() {
    clearTimeout(this.interval);
    this.sync = false;
  }

  render() {
    const { applicationDetail, currentPath, workflows, appName } = this.props;
    const { statistics, records, showDeployConfig } = this.state;
    const activeKey = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    const item = <Translation>{`app-${activeKey}`}</Translation>;
    const projectName = (applicationDetail && applicationDetail.project?.name) || '';
    const sourceOfTrust =
      applicationDetail?.labels && applicationDetail?.labels['app.oam.dev/source-of-truth'];
    return (
      <div>
        <Row>
          <Col span={6} className={classNames('padding16', 'breadcrumb')}>
            <Link to={'/'}>
              <Icon type="home" />
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
                title={i18n
                  .t('This application is managed by the addon, and it is readonly')
                  .toString()}
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
                resource: `project:${projectName}/application:${
                  applicationDetail && applicationDetail.name
                }`,
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
        <Row wrap={true}>
          <Col xl={12} m={24} s={24} className="padding16">
            <Card locale={locale().Card} contentHeight="auto" style={{ minHeight: '160px' }}>
              <Row>
                <Col span={6} style={{ padding: '22px 0' }}>
                  <NumItem
                    number={statistics?.envCount}
                    title={i18n.t('Environment Count').toString()}
                  />
                </Col>
                <Col span={6} style={{ padding: '22px 0' }}>
                  <NumItem
                    number={statistics?.targetCount}
                    title={i18n.t('Target Count').toString()}
                  />
                </Col>
                <Col span={6} style={{ padding: '22px 0' }}>
                  <NumItem
                    number={statistics?.revisionCount}
                    title={i18n.t('Revision Count').toString()}
                  />
                </Col>
                <Col span={6} style={{ padding: '22px 0' }}>
                  <NumItem
                    number={statistics?.workflowCount}
                    title={i18n.t('Workflow Count').toString()}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xl={12} m={24} s={24} className="padding16">
            <If condition={!records || (Array.isArray(records) && records.length === 0)}>
              <Card locale={locale().Card} contentHeight="auto" style={{ minHeight: '160px' }}>
                <Empty
                  message={<Translation>There is no running workflow</Translation>}
                  iconWidth={'30px'}
                />
              </Card>
            </If>
            <If condition={Array.isArray(records) && records.length > 0}>
              <WorkflowSlider appName={appName} records={records || []} />
            </If>
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
