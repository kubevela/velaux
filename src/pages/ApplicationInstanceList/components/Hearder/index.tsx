import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { Grid, Select, Button, Dialog, Message } from '@b-design/ui';
import { DeliveryTarget } from '../../../../interface/deliveryTarget';
import Translation from '../../../../components/Translation';
import {
  recycleApplicationEnvbinding,
  deleteApplicationEnvbinding,
} from '../../../../api/application';
import { ApplicationDetail, ApplicationStatus } from '../../../../interface/application';
import { If } from 'tsx-control-statements/components';

type Props = {
  targets?: Array<DeliveryTarget>;
  applicationStatus?: ApplicationStatus;
  applicationDetail?: ApplicationDetail;
  envName: string;
  updateQuery: (targetName: string) => void;
  loadApplicationEnvbinding: () => void;
  t: (key: string) => {};
};

type State = {
  recycleLoading: boolean;
  deleteLoading: boolean;
};

class Hearder extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      recycleLoading: false,
      deleteLoading: false,
    };
  }

  handleChange = (value: string) => {
    this.props.updateQuery(value);
  };
  recycleEnv = async () => {
    Dialog.confirm({
      content: 'Are you sure you want to reclaim the current environment?',
      onOk: () => {
        const { applicationDetail, envName } = this.props;
        if (applicationDetail) {
          recycleApplicationEnvbinding({ appName: applicationDetail.name, envName: envName }).then(
            (re) => {
              if (re) {
                Message.success('recycle applicationn env success');
              }
            },
          );
        }
      },
    });
  };
  deleteEnv = async () => {
    Dialog.confirm({
      content: 'Are you sure you want to delete the current environment?',
      onOk: () => {
        const { applicationDetail, envName, loadApplicationEnvbinding } = this.props;
        if (applicationDetail) {
          deleteApplicationEnvbinding({ appName: applicationDetail.name, envName: envName }).then(
            (re) => {
              if (re) {
                Message.success('delete applicationn env success');
                loadApplicationEnvbinding();
              }
            },
          );
        }
      },
    });
  };

  render() {
    const { Row, Col } = Grid;
    const { t } = this.props;
    const { recycleLoading, deleteLoading } = this.state;
    const clusterPlacehole = t('Delivery Target Selector').toString();
    const { targets, applicationStatus } = this.props;
    const clusterList = (targets || []).map((item: DeliveryTarget) => ({
      label: item.alias,
      value: item.name,
    }));

    return (
      <Row className="boder-radius-8">
        <Col span="6" style={{ marginBottom: '16px' }}>
          <Select
            mode="single"
            onChange={this.handleChange}
            dataSource={clusterList}
            placeholder={clusterPlacehole}
            hasClear
          />
        </Col>
        <Col span="18" className="flexright" style={{ marginBottom: '16px' }}>
          <If condition={!applicationStatus || !applicationStatus.status}>
            <Button loading={deleteLoading} onClick={this.deleteEnv}>
              <Translation>Delete</Translation>
            </Button>
          </If>
          <If condition={applicationStatus && applicationStatus.status}>
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
    );
  }
}

export default withTranslation()(Hearder);
