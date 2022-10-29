import React from 'react';
import { Grid, Icon, Select, Input, Button } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import './index.less';
import type { Project } from '../../../../interface/project';
import locale from '../../../../utils/locale';
import type { ShowMode } from '../..';
import i18n from '../../../../i18n';

const { Row, Col } = Grid;

type Props = {
  projects?: Project[];
  getPipelines: (params: any) => void;
  setMode: (mode: ShowMode) => void;
  showMode: ShowMode;
};

type State = {
  projectValue: string;
  targetValue: string;
  inputValue: string;
  envValue: string;
};

class SelectSearch extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      projectValue: '',
      targetValue: '',
      envValue: '',
      inputValue: '',
    };
    this.onChangeProject = this.onChangeProject.bind(this);
    this.onChangeTarget = this.onChangeTarget.bind(this);
    this.handleChangName = this.handleChangName.bind(this);
  }

  onChangeProject(e: string) {
    this.setState(
      {
        projectValue: e,
      },
      () => {
        this.getApplications();
      },
    );
  }

  onChangeTarget(e: string) {
    this.setState(
      {
        targetValue: e,
      },
      () => {
        this.getApplications();
      },
    );
  }

  handleChangName(e: string) {
    this.setState({
      inputValue: e,
    });
  }

  onChangeEnv = (e: string) => {
    this.setState(
      {
        envValue: e,
      },
      () => {
        this.getApplications();
      },
    );
  };

  handleClickSearch = () => {
    this.getApplications();
  };

  getApplications = async () => {
    const { projectValue, inputValue } = this.state;
    const params = {
      project: projectValue,
      query: inputValue,
    };
    this.props.getPipelines(params);
  };

  render() {
    const { projects } = this.props;
    const { projectValue, inputValue } = this.state;

    const projectPlaceholder = i18n.t('Search by Project').toString();
    const appPlaceholder = i18n.t('Search by name and description etc').toString();
    const projectSource = projects?.map((item) => {
      return {
        label: item.alias || item.name,
        value: item.name,
      };
    });
    return (
      <Row className="app-select-wrapper border-radius-8" wrap={true}>
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
            hasClear
            placeholder={appPlaceholder}
            onChange={this.handleChangName}
            onPressEnter={this.handleClickSearch}
            value={inputValue}
            className="item"
          />
        </Col>
        <Col xl={6} className="flexboth">
          <div className="padding16">
            <Button type={'secondary'} onClick={() => this.getApplications()}>
              <Icon type="refresh" />
            </Button>
          </div>
        </Col>
      </Row>
    );
  }
}

export default withTranslation()(SelectSearch);
