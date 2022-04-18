import React from 'react';
import { withTranslation } from 'react-i18next';
import { Grid, Select } from '@b-design/ui';
import type { EnvBinding } from '../../../../interface/application';
import locale from '../../../../utils/locale';
import { getLanguage } from '../../../../utils/common';

interface Label {
  label: string;
  value: string;
}

type Props = {
  statusList: Label[];
  envBinding?: EnvBinding[];
  updateQuery: (params: { isChangeEnv?: boolean; isChangeStatus?: boolean; value: string }) => void;
  t: (key: string) => {};
  dispatch?: ({}) => {};
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
    const { t } = this.props;
    const envPlacehole = t('Select Environment').toString();
    const statusPlacehole = t('Status select').toString();
    const { envValue, statusValue } = this.state;
    const { statusList, envBinding } = this.props;
    const envBinds = (envBinding || []).map((item: { name: string; alias?: string }) => ({
      label: item.alias || item.name,
      value: item.name,
    }));
    const language = getLanguage();
    return (
      <Row className="border-radius-8">
        <Col span="6" style={{ padding: '0 8px' }}>
          <Select
            locale={locale[language as 'en' | 'zh'].Select}
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
            locale={locale[language as 'en' | 'zh'].Select}
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
