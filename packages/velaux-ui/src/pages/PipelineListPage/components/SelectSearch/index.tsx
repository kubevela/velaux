import { Grid, Select, Input, Button } from '@alifd/next';
import React from 'react';

import './index.less';
import type { ShowMode } from '../..';
import { If } from '../../../../components/If';
import i18n from '../../../../i18n';
import type { UserProject } from '@velaux/data';
import { locale } from '../../../../utils/locale';
import { AiOutlineSearch } from 'react-icons/ai';
import { HiOutlineRefresh } from 'react-icons/hi';
const { Row, Col } = Grid;

type Props = {
  projects?: UserProject[];
  getPipelines: (params: any) => void;
  setMode: (mode: ShowMode) => void;
  showMode: ShowMode;
  disableProject?: boolean;
};

type State = {
  projectValue: string;
  inputValue: string;
};

class SelectSearch extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      projectValue: '',
      inputValue: '',
    };
    this.onChangeProject = this.onChangeProject.bind(this);
    this.handleChangName = this.handleChangName.bind(this);
  }

  onChangeProject(e: string) {
    this.setState(
      {
        projectValue: e,
      },
      () => {
        this.getPipelines();
      }
    );
  }

  handleChangName(e: string) {
    this.setState({
      inputValue: e,
    });
  }

  handleClickSearch = () => {
    this.getPipelines();
  };

  getPipelines = async () => {
    const { projectValue, inputValue } = this.state;
    const params = {
      project: projectValue,
      query: inputValue,
    };
    this.props.getPipelines(params);
  };

  render() {
    const { projects, disableProject } = this.props;
    const { projectValue, inputValue } = this.state;

    const projectPlaceholder = i18n.t('Search by Project').toString();
    const appPlaceholder = i18n.t('Search by Name and Description etc').toString();
    const projectSource = projects?.map((item) => {
      return {
        label: item.alias || item.name,
        value: item.name,
      };
    });
    return (
      <Row className="app-select-wrapper border-radius-8" wrap={true}>
        <If condition={!disableProject}>
          <Col xl={6} m={8} s={12} xxs={24} style={{ padding: '0 8px' }}>
            <Select
              locale={locale().Select}
              mode="single"
              size="large"
              onChange={this.onChangeProject}
              dataSource={projectSource}
              placeholder={projectPlaceholder}
              className="item"
              hasClear
              value={projectValue}
            />
          </Col>
        </If>
        <Col xl={6} m={8} s={12} xxs={24} style={{ padding: '0 8px' }}>
          <Input
            innerAfter={<AiOutlineSearch onClick={this.handleClickSearch} style={{ margin: 4 }} />}
            hasClear
            size="large"
            placeholder={appPlaceholder}
            onChange={this.handleChangName}
            onPressEnter={this.handleClickSearch}
            value={inputValue}
            className="item"
          />
        </Col>
        <Col xl={6} className="flexboth">
          <div className="padding16">
            <Button type={'secondary'} onClick={() => this.getPipelines()}>
              <HiOutlineRefresh />
            </Button>
          </div>
        </Col>
      </Row>
    );
  }
}

export default SelectSearch;
