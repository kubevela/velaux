import { Grid, Select } from '@alifd/next';
import React from 'react';
import i18n from '../../../../i18n';

import type { EnvBinding } from '@velaux/data';
import { locale } from '../../../../utils/locale';

interface Label {
  label: string;
  value: string;
}

type Props = {
  statusList: Label[];
  envBinding?: EnvBinding[];
  updateQuery: (params: { isChangeEnv?: boolean; isChangeStatus?: boolean; value: string }) => void;
  dispatch?: ({}) => {};
};

type State = {
  envValue: string;
  statusValue: string;
};

class Header extends React.Component<Props, State> {
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
    this.setState({ envValue: value });
    this.props.updateQuery({ isChangeEnv: true, value: value });
  }

  handleChangeStatus(value: string) {
    this.setState({ statusValue: value });
    this.props.updateQuery({ isChangeStatus: true, value: value });
  }

  transEnvBind = () => {};
  render() {
    const { Row, Col } = Grid;
    const envPlaceholder = i18n.t('Select Environment').toString();
    const statusPlaceholder = i18n.t('Select Status').toString();
    const { envValue, statusValue } = this.state;
    const { statusList, envBinding } = this.props;
    const envBinds = (envBinding || []).map((item: { name: string; alias?: string }) => ({
      label: item.alias || item.name,
      value: item.name,
    }));
    return (
      <Row className="border-radius-8">
        <Col span="6" style={{ padding: '0 8px' }}>
          <Select
            locale={locale().Select}
            mode="single"
            onChange={this.handleChangeEnv}
            dataSource={envBinds}
            placeholder={envPlaceholder}
            className="item"
            hasClear
            value={envValue}
          />
        </Col>

        <Col span="6" style={{ padding: '0 8px' }}>
          <Select
            locale={locale().Select}
            mode="single"
            onChange={this.handleChangeStatus}
            dataSource={statusList}
            placeholder={statusPlaceholder}
            className="item"
            hasClear
            value={statusValue}
          />
        </Col>
      </Row>
    );
  }
}

export default Header;
