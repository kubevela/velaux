import React from 'react';
import { Grid, Icon, Select, Input } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import Translation from '../../../../components/Translation';
import locale from '../../../../utils/locale';

type Props = {
  t: (key: string) => {};
  dispatch: ({}) => {};
  listFunction: ({}) => {};
  registries?: [];
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
    const { t, registries } = this.props;
    const queryPlaceholder = t('Search by name and description etc').toString();
    const { registryValue, inputValue } = this.state;

    return (
      <Row className="app-select-wrapper border-radius-8" wrap={true}>
        <Col xl={6} m={8} s={12} xxs={24} style={{ padding: '0 8px' }}>
          <Select
            locale={locale.Select}
            mode="single"
            size="large"
            onChange={this.handleChangRegistry}
            className="item"
            value={registryValue}
          >
            <Option value="">
              <Translation>All</Translation>
            </Option>
            {registries?.map((item: any) => {
              return (
                <Option key={item.name} value={item.name}>
                  {item.name}
                </Option>
              );
            })}
          </Select>
        </Col>

        <Col xl={6} m={8} s={12} xxs={24} style={{ padding: '0 8px' }}>
          <Input
            innerAfter={
              <Icon
                type="search"
                size="xs"
                onClick={this.handleClickSearch}
                style={{ margin: 4 }}
              />
            }
            placeholder={queryPlaceholder}
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
