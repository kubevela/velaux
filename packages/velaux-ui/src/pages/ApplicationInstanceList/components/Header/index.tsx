import { Button, Dialog, Dropdown, Grid, Menu, Message, Select } from '@alifd/next';
import { Link, routerRedux } from 'dva/router';
import i18n from 'i18next';
import React, { Component } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { AiOutlineCopy } from 'react-icons/ai';
import { HiOutlineRefresh } from 'react-icons/hi';
import { listApplicationServiceEndpoints } from '../../../../api/observation';

import {
  compareApplication,
  deleteApplicationEnvbinding,
  recycleApplicationEnvbinding,
} from '../../../../api/application';
import { ApplicationDiff } from '../../../../components/ApplicationDiff';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components';
import type {
  ApplicationCompareResponse,
  ApplicationComponent,
  ApplicationDetail,
  ApplicationStatus,
  Endpoint,
  EnvBinding,
  Target,
} from '@velaux/data';
import { locale } from '../../../../utils/locale';
import { getLink } from '../../../../utils/utils';
import { checkPermission } from '../../../../utils/permission';
import { LoginUserInfo } from '@velaux/data';

export type GatewayIP = {
  ip: string;
  name: string;
  port: number;
};

type Props = {
  // For the search
  targets?: Target[];
  components?: ApplicationComponent[];
  updateQuery?: (params: { target?: string; component?: string }) => void;
  applicationStatus?: ApplicationStatus;
  applicationDetail?: ApplicationDetail;
  envName: string;
  appName: string;
  envbinding?: EnvBinding;
  disableStatusShow?: boolean;
  refresh: () => void;
  dispatch: ({}) => void;
  userInfo?: LoginUserInfo;
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
  endpoints?: Endpoint[];
  loading?: boolean;
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
    this.loadApplicationEndpoints();
  }

  shouldComponentUpdate(nextProps: Props) {
    if (nextProps.appName + nextProps.envName != this.props.appName + this.props.envName) {
      this.compareCurrentWithCluster(this.props.appName, nextProps.envName);
      this.loadApplicationEndpoints();
    }
    return true;
  }

  getTarget = () => {
    const { targets } = this.props;
    const { target } = this.state;
    if (targets && target) {
      const t = targets.find((item) => item.name === target);
      return t;
    }
    return;
  };
  loadApplicationEndpoints = async () => {
    const { applicationDetail, appName, envbinding } = this.props;
    const { component } = this.state;
    const target = this.getTarget();

    if (applicationDetail && applicationDetail.name && envbinding) {
      const param = {
        appName: envbinding.appDeployName || appName,
        appNs: envbinding.appDeployNamespace,
        componentName: component,
        cluster: '',
        clusterNs: '',
      };
      if (target) {
        param.cluster = target.cluster?.clusterName || '';
        param.clusterNs = target.cluster?.namespace || '';
      }
      this.setState({ loading: true });
      listApplicationServiceEndpoints(param)
        .then((re) => {
          if (re && re.endpoints) {
            this.setState({ endpoints: re.endpoints });
          } else {
            this.setState({ endpoints: [] });
          }
        })
        .finally(() => {
          this.setState({ loading: false });
        });
    }
  };

  loadApplicationWorkflows = async () => {
    const { appName } = this.props;
    this.props.dispatch({
      type: 'application/getApplicationWorkflows',
      payload: { appName: appName },
    });
  };

  loadApplicationPolicies = async () => {
    const { appName } = this.props;
    this.props.dispatch({
      type: 'application/getApplicationPolicies',
      payload: { appName: appName },
    });
  };

  loadApplicationEnvbinding = async () => {
    const { appName } = this.props;
    if (appName) {
      this.props.dispatch({
        type: 'application/getApplicationEnvbinding',
        payload: { appName: appName },
      });
    }
  };

  updateEnvbindingList = () => {
    this.loadApplicationEnvbinding();
    this.loadApplicationWorkflows();
    this.loadApplicationPolicies();
  };

  compareCurrentWithCluster = (appName: string, envName: string) => {
    const { applicationStatus, applicationDetail, userInfo } = this.props;
    if (!applicationStatus) {
      this.setState({ compare: undefined });
      return;
    }
    if (
      !checkPermission(
        {
          resource: `project:${applicationDetail?.project?.name}/application:${applicationDetail?.name}`,
          action: 'compare',
        },
        applicationDetail?.project?.name,
        userInfo
      )
    ) {
      return;
    }
    compareApplication(appName, { compareLatestWithRunning: { env: envName } }).then(
      (res: ApplicationCompareResponse) => {
        this.setState({ compare: res });
      }
    );
  };

  handleTargetChange = (value: string) => {
    this.setState({ target: value }, () => {
      if (this.props.updateQuery) {
        this.props.updateQuery({ component: this.state.component, target: this.state.target });
      }
      this.loadApplicationEndpoints();
    });
  };

  handleComponentChange = (value: string) => {
    this.setState({ component: value }, () => {
      if (this.props.updateQuery) {
        this.props.updateQuery({ component: this.state.component, target: this.state.target });
      }
      this.loadApplicationEndpoints();
    });
  };

  recycleEnv = async () => {
    const { applicationDetail, envName, refresh, dispatch } = this.props;
    const sourceOfTrust = applicationDetail?.labels && applicationDetail?.labels['app.oam.dev/source-of-truth'];

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
                this.loadApplicationEndpoints();
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
      content: i18n.t('Are you sure you want to delete the current environment binding?').toString(),
      onOk: () => {
        const { applicationDetail, envName, dispatch } = this.props;
        if (applicationDetail) {
          deleteApplicationEnvbinding({ appName: applicationDetail.name, envName: envName }).then((re) => {
            if (re) {
              Message.success(i18n.t('Environment binding deleted successfully'));
              this.updateEnvbindingList();
              dispatch(routerRedux.push(`/applications/${applicationDetail.name}/config`));
            }
          });
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
    const { recycleLoading, deleteLoading, refreshLoading, compare, visibleApplicationDiff, endpoints } = this.state;
    const { targets, applicationStatus, disableStatusShow } = this.props;
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
    const span = 10 + (targetOptions.length > 0 ? 0 : 4) + (componentOptions.length > 0 ? 0 : 4);
    return (
      <div>
        <Row wrap={true} className="border-radius-8">
          {targetOptions.length > 0 && (
            <Col xl={4} m={12} xs={24} style={{ marginBottom: '16px', padding: '0 8px' }}>
              <Select
                locale={locale().Select}
                mode="single"
                onChange={this.handleTargetChange}
                dataSource={targetOptions}
                label={i18n.t('Target').toString()}
                placeholder={i18n.t('Target Selector').toString()}
                hasClear
              />
            </Col>
          )}
          {componentOptions.length > 0 && (
            <Col xl={4} m={12} xs={24} style={{ marginBottom: '16px', padding: '0 8px' }}>
              <Select
                locale={locale().Select}
                mode="single"
                onChange={this.handleComponentChange}
                dataSource={componentOptions}
                label={i18n.t('Component').toString()}
                placeholder={i18n.t('Component Selector').toString()}
                hasClear
              />
            </Col>
          )}
          <Col xl={6} m={12} xs={24} style={{ marginBottom: '16px', padding: '0 8px' }}>
            <If condition={applicationStatus}>
              <Message type={getAppStatusShowType(applicationStatus?.status)} size="medium" style={{ padding: '8px' }}>
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
          <Col xl={span} m={12} xs={24} className="flexright" style={{ marginBottom: '16px', padding: '0 8px' }}>
            <If condition={compare && compare.isDiff}>
              <Button type="secondary" onClick={this.showApplicationDiff}>
                <span className="circle circle-failure" />
                Diff
              </Button>
            </If>
            <Button type="secondary" style={{ marginLeft: '16px' }} loading={refreshLoading} onClick={this.refresh}>
              <HiOutlineRefresh />
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
                          <a style={{ color: '#1b58f4' }} target="_blank" href={linkURL} rel="noopener noreferrer">
                            {linkURL}
                          </a>
                        </Menu.Item>
                      );
                    }
                    return;
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
                    return;
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
            <If condition={applicationStatus && applicationStatus.status && applicationStatus.status != 'deleting'}>
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

export default Header;
