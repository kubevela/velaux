import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { Grid, Select, Button, Dialog, Message, Icon, Menu, Dropdown } from '@b-design/ui';
import type { Target } from '../../../../interface/target';
import Translation from '../../../../components/Translation';
import {
  recycleApplicationEnvbinding,
  deleteApplicationEnvbinding,
} from '../../../../api/application';
import type {
  ApplicationComponent,
  ApplicationDetail,
  ApplicationStatus,
  EnvBinding,
} from '../../../../interface/application';
import { If } from 'tsx-control-statements/components';
import locale from '../../../../utils/locale';
import { Link } from 'dva/router';
import i18n from 'i18next';
import Permission from '../../../../components/Permission';

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
  gatewayIPs?: string[];
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
    };
  }
  componentDidMount() {}

  loadEnvbinding = async () => {
    const { applicationDetail } = this.props;
    if (applicationDetail) {
      this.props.dispatch({
        type: 'application/getApplicationEnvbinding',
        payload: { appName: applicationDetail.name },
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
    Dialog.confirm({
      content: i18n.t('Are you sure you want to reclaim the current environment?'),
      onOk: () => {
        const { applicationDetail, envName, refresh } = this.props;
        if (applicationDetail) {
          recycleApplicationEnvbinding({ appName: applicationDetail.name, envName: envName }).then(
            (re) => {
              if (re) {
                Message.success(i18n.t('Recycle application environment success'));
                refresh();
              }
            },
          );
        }
      },
      locale: locale().Dialog,
    });
  };
  deleteEnv = async () => {
    Dialog.confirm({
      content: i18n.t('Are you sure you want to delete the current environment binding?'),
      onOk: () => {
        const { applicationDetail, envName, updateEnvs } = this.props;
        if (applicationDetail) {
          deleteApplicationEnvbinding({ appName: applicationDetail.name, envName: envName }).then(
            (re) => {
              if (re) {
                Message.success(i18n.t('Environment binding deleted successfully'));
                updateEnvs();
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
  };
  showStatus = () => {
    this.refresh();
    this.setState({ showStatus: true });
  };

  showEditDialog = () => {
    this.setState({ visibleEnvEditPlan: true });
  };

  render() {
    const { Row, Col } = Grid;
    const { appName, envName, components, applicationDetail } = this.props;
    const { recycleLoading, deleteLoading, refreshLoading } = this.state;
    const { targets, applicationStatus, gatewayIPs, disableStatusShow } = this.props;
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
        <Row className="border-radius-8">
          <Col span="4" style={{ marginBottom: '16px' }}>
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
          <Col span="4" style={{ marginBottom: '16px', paddingLeft: '16px' }}>
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
          <Col span={6}>
            <If condition={applicationStatus}>
              <Message
                type={getAppStatusShowType(applicationStatus?.status)}
                size="medium"
                style={{ marginLeft: '16px', padding: '8px' }}
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
          <Col span="10" className="flexright" style={{ marginBottom: '16px' }}>
            <Button type="secondary" loading={refreshLoading} onClick={this.refresh}>
              <Icon type="refresh" />
            </Button>

            <If condition={gatewayIPs && gatewayIPs.length > 0}>
              <Dropdown
                trigger={
                  <Button style={{ marginLeft: '16px' }} type="secondary">
                    <Translation>Service Endpoint</Translation>
                  </Button>
                }
              >
                <Menu>
                  {gatewayIPs?.map((item) => {
                    if (item) {
                      return (
                        <Menu.Item key={item}>
                          <a target="_blank" href={item}>
                            {item}
                          </a>
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
      </div>
    );
  }
}

export default withTranslation()(Header);
