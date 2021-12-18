import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { Grid, Select, Button, Dialog, Message, Icon, Menu, Dropdown } from '@b-design/ui';
import type { DeliveryTarget } from '../../../../interface/deliveryTarget';
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
import AddAndEditEnvBind from '../../../../layout/Application/components/AddAndEditEnvBind';
import locale from '../../../../utils/locale';

export type GatewayIP = {
  ip: string;
  name: string;
  port: number;
};
type Props = {
  targets?: DeliveryTarget[];
  applicationStatus?: ApplicationStatus;
  applicationDetail?: ApplicationDetail;
  envName: string;
  appName: string;
  envbinding?: EnvBinding;
  gatewayIPs?: GatewayIP[];
  updateQuery: (targetName: string) => void;
  updateEnvs: () => void;
  updateStatusShow: (show: boolean) => void;
  refresh: () => void;
  dispatch: ({}) => void;
  t: (key: string) => any;
};

type State = {
  recycleLoading: boolean;
  deleteLoading: boolean;
  refreshLoading: boolean;
  showStatus: boolean;
  visibleEnvEditPlan: boolean;
};

class Hearder extends Component<Props, State> {
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
                Message.success('recycle applicationn env success');
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
      content: 'Are you sure you want to delete the current environment?',
      onOk: () => {
        const { applicationDetail, envName, updateEnvs } = this.props;
        if (applicationDetail) {
          deleteApplicationEnvbinding({ appName: applicationDetail.name, envName: envName }).then(
            (re) => {
              if (re) {
                Message.success('delete applicationn env success');
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
    const { t, updateStatusShow } = this.props;
    const { recycleLoading, deleteLoading, refreshLoading, visibleEnvEditPlan } = this.state;
    const clusterPlacehole = t('Target Selector').toString();
    const { targets, applicationStatus, gatewayIPs } = this.props;
    const clusterList = (targets || []).map((item: DeliveryTarget) => ({
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
              placeholder={clusterPlacehole}
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
                <Translation>{`Application is ${
                  applicationStatus?.status || 'Initing'
                }`}</Translation>{' '}
                <a onClick={() => updateStatusShow(true)}>
                  <Translation>Check the details</Translation>
                </a>
              </Message>
            </If>
          </Col>
          <Col span="10" className="flexright" style={{ marginBottom: '16px' }}>
            <If condition={gatewayIPs && gatewayIPs.length > 0}>
              <Dropdown
                trigger={
                  <Button style={{ marginRight: '16px' }} type="secondary">
                    Service Endpoint
                  </Button>
                }
              >
                <Menu>
                  {gatewayIPs?.map((item) => {
                    if (item) {
                      return (
                        <Menu.Item key={item.ip}>
                          <a target="_blank" href={`http://${item.ip}:${item.port}`}>
                            {item.ip}:{item.port}
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

            <Button onClick={this.showEditDialog} type="secondary" style={{ marginLeft: '16px' }}>
              <Translation>Edit</Translation>
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
        <If condition={visibleEnvEditPlan}>
          <AddAndEditEnvBind
            onClose={() => {
              this.setState({ visibleEnvEditPlan: false });
            }}
            onOK={() => {
              this.loadEnvbinding();
              this.loadApplicationWorkflows();
              this.setState({ visibleEnvEditPlan: false });
            }}
            editEnvBinding={this.props.envbinding}
            key={'EditEnvBind'}
          />
        </If>
      </div>
    );
  }
}

export default withTranslation()(Hearder);
