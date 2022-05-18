import React from 'react';
import { Grid, Icon, Input } from '@b-design/ui';
import i18n from '../../../../i18n';
import './index.less';

type Props = {
  searchValue: string;
  handleChangName: (param: string) => void;
};

class SelectSearch extends React.Component<Props> {
  handleChangName = (e: string) => {
    this.props.handleChangName(e);
  };

  render() {
    const { Row, Col } = Grid;
    const { searchValue } = this.props;
    return (
      <Row className="definitions-select-wrapper border-radius-8" wrap={true}>
        <Col xl={6} m={8} s={12} xxs={24} style={{ padding: '0 8px' }}>
          <Input
            innerAfter={<Icon type="search" size="xs" style={{ margin: 4 }} />}
            hasClear
            placeholder={i18n.t('Search by TypeName')}
            onChange={this.handleChangName}
            value={searchValue}
            className="item"
          />
        </Col>
      </Row>
    );
  }
}

export default SelectSearch;
