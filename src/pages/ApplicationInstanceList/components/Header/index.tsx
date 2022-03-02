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
  ApplicationDetail,
  ApplicationStatus,
  EnvBinding,
} from '../../../../interface/application';
import { If } from 'tsx-control-statements/components';
import locale from '../../../../utils/locale';
import { Link } from 'dva/router';
import i18n from 'i18next';

export type GatewayIP = {
  ip: string;
  name: string;
  port: number;
};

type Props = {
  targets?: Target[];
  applicationStatus?: ApplicationStatus;
  applicationDetail?: ApplicationDetail;
  envName: string;
  appName: string;
  envbinding?: EnvBinding;
  disableStatusShow?: boolean;
  gatewayIPs?: string[];
  updateQuery: (targetName: string) => void;
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
  handleChange = (value: string) => {
    this.props.updateQuery(value);
  };
  recycleEnv = async () => {
    Dialog.confirm({
      content: 'Are you sure you want to reclaim the current environment?',
      onOk: () => {
        const { applicationDetail, envName, refresh } = this.props;
        if (applicationDetail) {
          recycleApplicationEnvbinding({ appName: applicationDetail.name, envName: envName }).then(
            (re) => {
              if (re) {
                Message.success('recycle applicationn environment success');
                refresh();
              }
            },
          );
        }
      },
      locale: locale.Dialog,
    });
  };
  deleteEnv = async () => {
    Dialog.confirm({
      content: 'Are you sure you want to delete the current environment binding?',
      onOk: () => {
        const { applicationDetail, envName, updateEnvs } = this.props;
        if (applicationDetail) {
          deleteApplicationEnvbinding({ appName: applicationDetail.name, envName: envName }).then(
            (re) => {
              if (re) {
                Message.success('delete applicationn environment binding success');
                updateEnvs();
              }
            },
          );
        }
      },
      locale: locale.Dialog,
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
    const { appName, envName } = this.props;
    const { recycleLoading, deleteLoading, refreshLoading } = this.state;
    const { targets, applicationStatus, gatewayIPs, disableStatusShow } = this.props;
    const clusterList = (targets || []).map((item: Target) => ({
      label: item.alias,
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
    return (
      <div>
        <Row className="boder-radius-8">
          <Col span="6" style={{ marginBottom: '16px' }}>
            <Select
              locale={locale.Select}
              mode="single"
              onChange={this.handleChange}
              dataSource={clusterList}
              placeholder={i18n.t('Target Selector').toString()}
              hasClear
            />
          </Col>
          <Col span={8}>
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
            <If condition={gatewayIPs && gatewayIPs.length > 0}>
              <Dropdown
                trigger={
                  <Button style={{ marginRight: '16px' }} type="secondary">
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
            <Button type="secondary" loading={refreshLoading} onClick={this.refresh}>
              <Icon type="refresh" />
            </Button>

            <If condition={!applicationStatus || !applicationStatus.status}>
              <Button
                style={{ marginLeft: '16px' }}
                loading={deleteLoading}
                onClick={this.deleteEnv}
              >
                <Translation>Delete</Translation>
              </Button>
            </If>
            <If
              condition={
                applicationStatus &&
                applicationStatus.status &&
                applicationStatus.status != 'deleting'
              }
            >
              <Button
                loading={recycleLoading}
                onClick={this.recycleEnv}
                type="primary"
                style={{ marginLeft: '16px' }}
              >
                <Translation>Recycle</Translation>
              </Button>
            </If>
          </Col>
        </Row>
      </div>
    );
  }
}

export default withTranslation()(Header);
