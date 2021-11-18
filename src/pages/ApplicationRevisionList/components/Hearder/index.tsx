import React from 'react';
import { withTranslation } from 'react-i18next';
import { Button, Message, Grid, Search, Icon, Select, Input } from '@b-design/ui';
import { ApplicationDetail, EnvBinding, Trait, ApplicationComponent } from '../../../../interface/application';
import './index.less';
import Translation from '../../../../components/Translation';

interface Label {
  label: string;
  value: string;
}

type Props = {
  statusList: Array<Label>;
  envBinding: Array<EnvBinding>
  clusterList?: [];
  namespaceList?: [];
  updateQuery: (params: { isChangeEnv?: boolean, isChangeStatus?: boolean; value: string }) => void;
  t: (key: string) => {};
  dispatch?: ({ }) => {};
};

type State = {
  envValue: string;
  statusValue: string;
};

class Hearder extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      envValue: '',
      statusValue: '',
    };
    this.handleChangeEnv = this.handleChangeEnv.bind(this);
    this.handleChangeStatus = this.handleChangeStatus.bind(this);
  }

  handleChangeEnv(value: string) {
    this.setState({ envValue: value })
    this.props.updateQuery({ isChangeEnv: true, value: value });
  }

  handleChangeStatus(value: string) {
    this.setState({ statusValue: value })
    this.props.updateQuery({ isChangeStatus: true, value: value });
  }

  transEnvBind = () => {
    const { envBinding } = this.props;
  }
  render() {
    const { Row, Col } = Grid;
    const { t } = this.props;
    const envPlacehole = t('Environmental select').toString();
    const statusPlacehole = t('Status select').toString();
    const { envValue, statusValue } = this.state;
    const { statusList, envBinding } = this.props;
    const envBinds = (envBinding || []).map((item: { name: string; alias?: string }) => ({
      label: item.alias || item.name,
      value: item.name,
    }));
    return (
      <Row className="boder-radius-8">
        <Col span="6" style={{ padding: '0 8px' }}>
          <Select
            mode="single"
            size="small"
            onChange={this.handleChangeEnv}
            dataSource={envBinds}
            placeholder={envPlacehole}
            className="item"
            hasClear
            value={envValue}
          />
        </Col>

        <Col span="6" style={{ padding: '0 8px' }}>
          <Select
            mode="single"
            size="small"
            onChange={this.handleChangeStatus}
            dataSource={statusList}
            placeholder={statusPlacehole}
            className="item"
            hasClear
            value={statusValue}
          />
        </Col>

      </Row>
    );
  }
}

export default withTranslation()(Hearder);
