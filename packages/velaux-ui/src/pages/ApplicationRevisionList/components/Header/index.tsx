import { Select } from '@alifd/next';
import React from 'react';
import i18n from '../../../../i18n';

import type { EnvBinding } from '@velaux/data';
import { Translation } from '../../../../components/Translation';
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
    const { envValue, statusValue } = this.state;
    const { statusList, envBinding } = this.props;
    const envBinds = (envBinding || []).map((item: { name: string; alias?: string }) => ({
      label: item.alias || item.name,
      value: item.name,
    }));
    return (
      <div className="app-tab-toolbar">
        <Select
          locale={locale().Select}
          mode="single"
          onChange={this.handleChangeEnv}
          dataSource={envBinds}
          label={i18n.t('Environment').toString()}
          placeholder={i18n.t('All').toString()}
          hasClear
          value={envValue}
        />
        <Select
          locale={locale().Select}
          mode="single"
          onChange={this.handleChangeStatus}
          dataSource={statusList}
          label={i18n.t('Status').toString()}
          placeholder={i18n.t('All').toString()}
          hasClear
          value={statusValue}
        />
        <span className="app-tab-hint">
          <Translation>Each deploy, and the configuration it deployed.</Translation>
        </span>
      </div>
    );
  }
}

export default Header;
