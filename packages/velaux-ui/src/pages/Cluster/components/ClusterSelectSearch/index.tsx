import { Grid, Input } from '@alifd/next';
import React from 'react';

import './index.less';
import i18n from '../../../../i18n';
import { AiOutlineSearch } from 'react-icons/ai';

type Props = {
  query: (value: string) => void;
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
    this.props.query(inputValue);
  };

  render() {
    const { Row, Col } = Grid;
    const { inputValue } = this.state;
    return (
      <Row className="cluster-input-wrapper">
        <Col span="24">
          <Input
            innerAfter={<AiOutlineSearch onClick={this.handleClickSearch} style={{ margin: 4 }} />}
            placeholder={i18n.t('Search by Name and Description etc').toString()}
            onChange={this.handleChangName}
            onPressEnter={this.handleClickSearch}
            value={inputValue}
            size="large"
            className="item"
          />
        </Col>
      </Row>
    );
  }
}

export default InputSearch;
