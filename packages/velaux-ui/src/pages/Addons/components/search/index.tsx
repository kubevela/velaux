import { Checkbox, Grid, Input, Select, } from '@alifd/next';
import React from 'react';
import { AiOutlineSearch } from 'react-icons/ai';

import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import { locale } from '../../../../utils/locale';
import './index.less';

type Props = {
  dispatch: ({}) => {};
  listFunction: ({}) => {};
  onTagChange: (tags: string[]) => void;
  tagList?: Array<{ tag: string; num: number }>;
  registries?: [];
  extButtons?: [React.ReactNode];
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
      }
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
    const { registries, extButtons } = this.props;
    const queryPlaceholder = i18n.t('Search by Name and Description etc').toString();
    const { registryValue, inputValue } = this.state;

    return (
      <div className="border-radius-8 addon-search">
        <div>
          <Row wrap={true} gutter={12}>
            <Col l={8} m={8} s={12} xxs={24}>
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

            <Col l={8} m={8} s={12} xxs={24}>
              <Input
                innerAfter={<AiOutlineSearch onClick={this.handleClickSearch} style={{ margin: 4 }} />}
                placeholder={queryPlaceholder}
                size="large"
                onChange={this.handleChangName}
                onPressEnter={this.handleClickSearch}
                value={inputValue}
                className="item"
              />
            </Col>

            <Col l={8} m={8} s={12} xxs={24}>
              <div className={'ext-btn'} >
                {extButtons &&
                  extButtons.map((item) => {
                    return item;
                  })}
              </div>
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

export default SelectSearch;
