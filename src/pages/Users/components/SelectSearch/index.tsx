import React from 'react';
import { Grid, Icon, Input } from '@b-design/ui';
import i18n from '../../../../i18n';
import './index.less';

const { Row, Col } = Grid;

type Props = {
  name: string;
  alias: string;
  email: string;
  handleChangName: (param: string) => void;
  handleChangAlias: (param: string) => void;
  handleChangEmail: (param: string) => void;
};

type State = {
  name: string;
  email: string;
  alias: string;
};

class SelectSearch extends React.Component<Props, State> {
  handleChangName = (e: string) => {
    this.props.handleChangName(e);
  };

  handleChangAlias = (e: string) => {
    this.props.handleChangAlias(e);
  };

  handleChangEmail = (e: string) => {
    this.props.handleChangEmail(e);
  };

  render() {
    const { name, alias, email } = this.props;
    return (
      <Row className="user-select-wrapper boder-radius-8" wrap={true}>
        <Col xl={6} m={8} s={12} xxs={24} style={{ padding: '0 8px' }}>
          <Input
            innerAfter={<Icon type="search" size="xs" style={{ margin: 4 }} />}
            hasClear
            placeholder={i18n.t('Search by Name')}
            onChange={this.handleChangName}
            value={name}
            className="item"
          />
        </Col>

        <Col xl={6} m={8} s={12} xxs={24} style={{ padding: '0 8px' }}>
          <Input
            innerAfter={<Icon type="search" size="xs" style={{ margin: 4 }} />}
            hasClear
            placeholder={i18n.t('Search by alias')}
            onChange={this.handleChangAlias}
            value={alias}
            className="item"
          />
        </Col>

        <Col xl={6} m={8} s={12} xxs={24} style={{ padding: '0 8px' }}>
          <Input
            innerAfter={<Icon type="search" size="xs" style={{ margin: 4 }} />}
            hasClear
            placeholder={i18n.t('Search by email')}
            onChange={this.handleChangEmail}
            value={email}
            className="item"
          />
        </Col>
      </Row>
    );
  }
}

export default SelectSearch;
