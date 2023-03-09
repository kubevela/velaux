import { Grid, Select, Button, Dialog, Message, Icon, Menu, Dropdown } from '@b-design/ui';
import { Link, routerRedux } from 'dva/router';
import i18n from 'i18next';
import React, { Component } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { withTranslation } from 'react-i18next';
import { AiOutlineCopy } from 'react-icons/ai';

import {
  recycleApplicationEnvbinding,
  deleteApplicationEnvbinding,
  compareApplication,
} from '../../../../api/application';
import { ApplicationDiff } from '../../../../components/ApplicationDiff';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import Translation from '../../../../components/Translation';
import type {
  ApplicationCompareResponse,
  ApplicationComponent,
  ApplicationDetail,
  ApplicationStatus,
  EnvBinding,
} from '../../../../interface/application';
import type { Endpoint } from '../../../../interface/observation';
import type { Target } from '../../../../interface/target';
import locale from '../../../../utils/locale';
import { getLink } from '../../../../utils/utils';

export type GatewayIP = {
  ip: string;
  name: string;
  port: number;
};

type Props = {
  targets?: Target[];
  applicationStatus?: ApplicationStatus;
  applicationDetail?: ApplicationDetail;
  components?: ApplicationComponent[];
  envName: string;
  appName: string;
  envbinding?: EnvBinding;
  disableStatusShow?: boolean;
  endpoints?: Endpoint[];
  updateQuery: (params: { target?: string; component?: string }) => void;
  updateEnvs: () => void;
  refresh: () => void;
  dispatch: ({}) => void;
};

type State = {
  recycleLoading: boolean;
  deleteLoading: boolean;
  refreshLoading: boolean;
  showStatus: boolean;
  visibleEnvEditPlan: boolean;
  target?: string;
  component?: string;
  compare?: ApplicationCompareResponse;
  visibleApplicationDiff: boolean;
};

class Header extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      recycleLoading: false,
      deleteLoading: false,
      refreshLoading: false,
      showStatus: false,
      visibleEnvEditPlan: false,
      visibleApplicationDiff: false,
    };
  }
  componentDidMount() {
    this.compareCurrentWithCluster(this.props.appName, this.props.envName);
  }

  shouldComponentUpdate(nextProps: Props) {
    if (nextProps.appName + nextProps.envName != this.props.appName + this.props.envName) {
      this.compareCurrentWithCluster(this.props.appName, nextProps.envName);
    }
    return true;
  }

  compareCurrentWithCluster = (appName: string, envName: string) => {
    const { applicationStatus } = this.props;
    if (!applicationStatus) {
      this.setState({ compare: undefined });
      return;
    }
    compareApplication(appName, { compareLatestWithRunning: { env: envName } }).then(
      (res: ApplicationCompareResponse) => {
        this.setState({ compare: res });
      },
    );
  };

  handleTargetChange = (value: string) => {
    this.setState({ target: value }, () => {
      this.props.updateQuery({ component: this.state.component, target: this.state.target });
    });
  };

  handleComponentChange = (value: string) => {
    this.setState({ component: value }, () => {
      this.props.updateQuery({ component: this.state.component, target: this.state.target });
    });
  };

  recycleEnv = async () => {
    const { applicationDetail, envName, refresh, dispatch } = this.props;
    const sourceOfTrust =
      applicationDetail?.labels && applicationDetail?.labels['app.oam.dev/source-of-truth'];

    let content = 'Are you sure you want to recycle the application form this environment?';
    if (sourceOfTrust === 'from-k8s-resource') {
      content =
        'This application is synchronizing from cluster, recycling from this environment means this application will be deleted.';
    }
    Dialog.confirm({
      needWrapper: true,
      content: <span>{i18n.t(content)}</span>,
      onOk: () => {
        if (applicationDetail) {
          recycleApplicationEnvbinding({
            appName: applicationDetail.name,
            envName: envName,
          }).then((re) => {
            if (re) {
              Message.success(i18n.t('Recycle application environment success'));
              if (sourceOfTrust === 'from-k8s-resource') {
                dispatch(routerRedux.push(`/applications`));
              } else {
                refresh();
              }
            }
          });
        }
      },
      locale: locale().Dialog,
    });
  };

  deleteEnv = async () => {
    Dialog.confirm({
      content: i18n.t('Are you sure you want to delete the current environment binding?'),
      onOk: () => {
        const { applicationDetail, envName, updateEnvs, dispatch } = this.props;
        if (applicationDetail) {
          deleteApplicationEnvbinding({ appName: applicationDetail.name, envName: envName }).then(
            (re) => {
              if (re) {
                Message.success(i18n.t('Environment binding deleted successfully'));
                updateEnvs();
                dispatch(routerRedux.push(`/applications/${applicationDetail.name}/config`));
              }
            },
          );
        }
      },
      locale: locale().Dialog,
    });
  };

  refresh = async () => {
    this.props.refresh();
    this.compareCurrentWithCluster(this.props.appName, this.props.envName);
  };

  showStatus = () => {
    this.refresh();
    this.setState({ showStatus: true });
  };

  showEditDialog = () => {
    this.setState({ visibleEnvEditPlan: true });
  };

  showApplicationDiff = () => {
    this.setState({ visibleApplicationDiff: true });
  };

  render() {
    const { Row, Col } = Grid;
    const { appName, envName, components, applicationDetail } = this.props;
    const { recycleLoading, deleteLoading, refreshLoading, compare, visibleApplicationDiff } =
      this.state;
    const { targets, applicationStatus, endpoints, disableStatusShow } = this.props;
    const targetOptions = (targets || []).map((item: Target) => ({
      label: item.alias || item.name,
      value: item.name,
    }));
    const componentOptions = (components || []).map((item: ApplicationComponent) => ({
      label: item.alias || item.name,
      value: item.name,
    }));
    const getAppStatusShowType = (status: string | undefined) => {
      if (!status) {
        return 'notice';
      }
      switch (status) {
        case 'running':
          return 'success';
        case 'workflowFinished':
          return 'success';
        case 'unhealthy':
          return 'error';
      }
      return 'warning';
    };
    const projectName = applicationDetail && applicationDetail.project?.name;
    return (
      <div>
        <Row wrap={true} className="border-radius-8">
          <Col xl={4} m={12} xs={24} style={{ marginBottom: '16px', padding: '0 8px' }}>
            <Select
              locale={locale().Select}
              mode="single"
              onChange={this.handleTargetChange}
              dataSource={targetOptions}
              label={i18n.t('Target')}
              placeholder={i18n.t('Target Selector').toString()}
              hasClear
            />
          </Col>
          <Col xl={4} m={12} xs={24} style={{ marginBottom: '16px', padding: '0 8px' }}>
            <Select
              locale={locale().Select}
              mode="single"
              onChange={this.handleComponentChange}
              dataSource={componentOptions}
              label={i18n.t('Component')}
              placeholder={i18n.t('Component Selector').toString()}
              hasClear
            />
          </Col>
          <Col xl={6} m={12} xs={24} style={{ marginBottom: '16px', padding: '0 8px' }}>
            <If condition={applicationStatus}>
              <Message
                type={getAppStatusShowType(applicationStatus?.status)}
                size="medium"
                style={{ padding: '8px' }}
              >
                <Translation>{`Application is ${applicationStatus?.status || 'Init'}`}</Translation>
                <If condition={!disableStatusShow}>
                  <span style={{ marginLeft: '16px' }}>
                    <Link to={`/applications/${appName}/envbinding/${envName}/status`}>
                      <Translation>Check the details</Translation>
                    </Link>
                  </span>
                </If>
              </Message>
            </If>
          </Col>
          <Col
            xl={10}
            m={12}
            xs={24}
            className="flexright"
            style={{ marginBottom: '16px', padding: '0 8px' }}
          >
            <If condition={compare && compare.isDiff}>
              <Button type="secondary" onClick={this.showApplicationDiff}>
                <span className="circle circle-failure" />
                Diff
              </Button>
            </If>
            <Button
              type="secondary"
              style={{ marginLeft: '16px' }}
              loading={refreshLoading}
              onClick={this.refresh}
            >
              <Icon type="refresh" />
            </Button>

            <If condition={endpoints && endpoints.length > 0}>
              <Dropdown
                trigger={
                  <Button style={{ marginLeft: '16px' }} type="secondary">
                    <Translation>Service Endpoint</Translation>
                  </Button>
                }
              >
                <Menu>
                  {endpoints?.map((item) => {
                    const linkURL = getLink(item);
                    if (item && !item.endpoint.inner) {
                      return (
                        <Menu.Item key={linkURL}>
                          <If condition={item.endpoint.portName}>
                            <span className="margin-right-5">{item.endpoint.portName}:</span>
                          </If>
                          <a
                            style={{ color: '#1b58f4' }}
                            target="_blank"
                            href={linkURL}
                            rel="noopener noreferrer"
                          >
                            {linkURL}
                          </a>
                        </Menu.Item>
                      );
                    }
                  })}
                  {endpoints?.map((item) => {
                    const linkURL = getLink(item);
                    if (item && item.endpoint.inner) {
                      return (
                        <Menu.Item key={linkURL}>
                          <If condition={item.endpoint.portName}>
                            <span className="margin-right-5">{item.endpoint.portName}:</span>
                          </If>
                          <span>
                            {linkURL}(Inner)
                            <CopyToClipboard
                              onCopy={() => {
                                Message.success('Copied successfully');
                              }}
                              text={linkURL}
                            >
                              <AiOutlineCopy size={14} />
                            </CopyToClipboard>
                          </span>
                        </Menu.Item>
                      );
                    }
                  })}
                </Menu>
              </Dropdown>
            </If>

            <If condition={!applicationStatus || !applicationStatus.status}>
              <Permission
                request={{
                  resource: `project:${projectName}/application:${applicationDetail?.name}/envBinding:${envName}`,
                  action: 'delete',
                }}
                project={projectName}
              >
                <Button
                  style={{ marginLeft: '16px' }}
                  loading={deleteLoading}
                  disabled={applicationDetail?.readOnly}
                  className="danger-btn"
                  onClick={this.deleteEnv}
                >
                  <Translation>Delete</Translation>
                </Button>
              </Permission>
            </If>
            <If
              condition={
                applicationStatus &&
                applicationStatus.status &&
                applicationStatus.status != 'deleting'
              }
            >
              <Permission
                request={{
                  resource: `project:${projectName}/application:${applicationDetail?.name}/envBinding:${envName}`,
                  action: 'recycle',
                }}
                project={projectName}
              >
                <Button
                  loading={recycleLoading}
                  onClick={this.recycleEnv}
                  disabled={applicationDetail?.readOnly}
                  className="danger-btn"
                  style={{ marginLeft: '16px' }}
                >
                  <Translation>Recycle</Translation>
                </Button>
              </Permission>
            </If>
          </Col>
        </Row>
        <If condition={visibleApplicationDiff}>
          {compare && (
            <ApplicationDiff
              id={appName + envName}
              baseName="Deployed Application"
              targetName="Latest Application Configuration"
              compare={compare}
              onClose={() => {
                this.setState({ visibleApplicationDiff: false });
              }}
            />
          )}
        </If>
      </div>
    );
  }
}

export default withTranslation()(Header);
