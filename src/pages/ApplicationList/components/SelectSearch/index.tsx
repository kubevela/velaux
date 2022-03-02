import React from 'react';
import { Grid, Icon, Select, Input } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import './index.less';
import type { Project } from '../../../../interface/project';
import locale from '../../../../utils/locale';
import type { Target } from '../../../../interface/target';
import type { Env } from '../../../../interface/env';

const { Row, Col } = Grid;

type Props = {
  t: (key: string) => {};
  dispatch: ({}) => {};
  targetList?: Target[];
  projects?: Project[];
  envs?: Env[];
  getApplications: (params: any) => void;
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
    const { projectValue, targetValue, inputValue, envValue } = this.state;
    const params = {
      project: projectValue,
      targetName: targetValue,
      query: inputValue,
      env: envValue,
    };
    this.props.getApplications(params);
  };

  render() {
    const { targetList, projects, t, envs } = this.props;
    const { projectValue, targetValue, inputValue, envValue } = this.state;

    const projectPlacehole = t('Search by Project').toString();
    const targetPlacehole = t('Search by Target').toString();
    const appPlacehole = t('Search by name and description etc').toString();
    const envPlacehole = t('Search by Environment').toString();
    const projectSource = projects?.map((item) => {
      return {
        label: item.alias || item.name,
        value: item.name,
      };
    });

    const targetSource = targetList?.map((item) => {
      return {
        label: item.alias || item.name,
        value: item.name,
      };
    });

    const envSource = envs?.map((env) => {
      return {
        label: env.alias || env.name,
        value: env.name,
      };
    });
    return (
      <Row className="app-select-wraper boder-radius-8" wrap={true}>
        <Col xl={6} m={8} s={12} xxs={24} style={{ padding: '0 8px' }}>
          <Select
            locale={locale.Select}
            mode="single"
            size="large"
            onChange={this.onChangeProject}
            dataSource={projectSource}
            placeholder={projectPlacehole}
            className="item"
            hasClear
            value={projectValue}
          />
        </Col>
        <Col xl={6} m={8} s={12} xxs={24} style={{ padding: '0 8px' }}>
          <Select
            locale={locale.Select}
            mode="single"
            size="large"
            onChange={this.onChangeEnv}
            dataSource={envSource}
            placeholder={envPlacehole}
            className="item"
            hasClear
            value={envValue}
          />
        </Col>
        <Col xl={6} m={8} s={12} xxs={24} style={{ padding: '0 8px' }}>
          <Select
            locale={locale.Select}
            mode="single"
            size="large"
            onChange={this.onChangeTarget}
            dataSource={targetSource}
            placeholder={targetPlacehole}
            className="item"
            hasClear
            value={targetValue}
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
            placeholder={appPlacehole}
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
