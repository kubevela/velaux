import React from 'react';
import { Grid, Icon, Input } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import './index.less';
import i18n from '../../../../i18n';

type Props = {
  t: (key: string) => {};
  dispatch: ({}) => {};
  getChildCompentQuery: (value: string) => (() => void) | undefined;
};

type State = {
  inputValue: string;
};

class InputSearch extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      inputValue: '',
    };
  }

  handleChangName = (value: string) => {
    this.setState({
      inputValue: value,
    });
  };

  handleClickSearch = () => {
    const { inputValue } = this.state;
    this.props.getChildCompentQuery(inputValue);
  };

  render() {
    const { Row, Col } = Grid;
    const { inputValue } = this.state;
    return (
      <Row className="cluster-input-wraper">
        <Col span="24">
          <Input
            innerAfter={
              <Icon
                type="search"
                size="xs"
                onClick={this.handleClickSearch}
                style={{ margin: 4 }}
              />
            }
            placeholder={i18n.t('Search by name and description etc').toString()}
            onChange={this.handleChangName}
            onPressEnter={this.handleClickSearch}
            value={inputValue}
            className="item"
          />
        </Col>
      </Row>
    );
  }
}

export default withTranslation()(InputSearch);
