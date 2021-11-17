import React from 'react';
import { Grid, Icon, Select, Input } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import Translation from '../../../../components/Translation';

type Props = {
  t: (key: string) => {};
  dispatch: ({}) => {};
  listFunction: ({}) => {};
  registrys?: [];
};

type State = {
  registryValue: string;
  inputValue: string;
};

class SelectSearch extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      registryValue: '',
      inputValue: '',
    };
    this.handleChangRegistry = this.handleChangRegistry.bind(this);
    this.handleChangName = this.handleChangName.bind(this);
  }

  handleChangRegistry(e: string) {
    this.setState(
      {
        registryValue: e,
      },
      () => {
        this.handleClickSearch();
      },
    );
  }

  handleChangName(e: string) {
    this.setState({ inputValue: e });
  }

  handleClickSearch = () => {
    const { listFunction } = this.props;
    const { registryValue, inputValue } = this.state;
    listFunction({ registry: registryValue, query: inputValue });
  };

  render() {
    const { Row, Col } = Grid;
    const { Option } = Select;
    const { t, registrys } = this.props;
    const registryPlacehole = t('Registry Screening').toString();
    const queryPlacehole = t('Search by name and description.').toString();
    const { registryValue, inputValue } = this.state;

    return (
      <Row className="app-select-wraper boder-radius-8">
        <Col span="6" style={{ padding: '0 8px' }}>
          <Select
            mode="single"
            size="large"
            onChange={this.handleChangRegistry}
            placeholder={registryPlacehole}
            className="item"
            value={registryValue}
          >
            <Option value="">
              <Translation>All</Translation>
            </Option>
            {registrys?.map((item: any) => {
              return (
                <Option key={item.name} value={item.name}>
                  {item.name}
                </Option>
              );
            })}
          </Select>
        </Col>

        <Col span="6" style={{ padding: '0 8px' }}>
          <Input
            innerAfter={
              <Icon
                type="search"
                size="xs"
                onClick={this.handleClickSearch}
                style={{ margin: 4 }}
              />
            }
            placeholder={queryPlacehole}
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

export default withTranslation()(SelectSearch);
