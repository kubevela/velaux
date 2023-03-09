import { Grid, Icon, Select, Input, Checkbox } from '@b-design/ui';
import React from 'react';
import { withTranslation } from 'react-i18next';

import Translation from '../../../../components/Translation';
import locale from '../../../../utils/locale';
import './index.less';

type Props = {
  t: (key: string) => {};
  dispatch: ({}) => {};
  listFunction: ({}) => {};
  onTagChange: (tags: string[]) => void;
  tagList?: Array<{ tag: string; num: number }>;
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

  generateTagList = () => {
    const { tagList } = this.props;
    const data: { label: string; value: string }[] = [];
    tagList?.map((tag) => {
      if (tag.num > 2) {
        data.push({ label: tag.tag, value: tag.tag });
      }
    });
    return data;
  };

  render() {
    const { Row, Col } = Grid;
    const { Option } = Select;
    const { t, registries } = this.props;
    const queryPlaceholder = t('Search by name and description etc').toString();
    const { registryValue, inputValue } = this.state;

    return (
      <div className="border-radius-8 addon-search">
        <div>
          <Row wrap={true}>
            <Col xl={6} m={8} s={12} xxs={24} style={{ padding: '0 8px' }}>
              <Select
                locale={locale().Select}
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
          <div className="tag-search">
            <div className="tag-name">
              <Translation>Tags</Translation>
            </div>
            <div className="tag-list">
              <Checkbox.Group
                dataSource={this.generateTagList()}
                onChange={(tags) => {
                  this.props.onTagChange(tags);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTranslation()(SelectSearch);
