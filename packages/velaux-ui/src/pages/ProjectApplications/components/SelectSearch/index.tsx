import { Grid, Icon, Select, Input, Button } from '@alifd/next';
import React, { Fragment } from 'react';

import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { Env , Target } from '@velaux/data';
import { locale } from '../../../../utils/locale';
import './index.less';
import type { ShowMode } from '../../../ApplicationList';

const { Row, Col } = Grid;

type Props = {
  targetList?: Target[];
  envs?: Env[];
  listApplication: (params: any) => void;
  onAddApplication: () => void;
  setLabelValue: (labels: string[]) => void;
  appLabels?: string[];
  labelValue?: string[];
  projectName?: string;
  showMode: ShowMode;
  setMode: (mode: ShowMode) => void;
};

type State = {
  targetValue: string;
  inputValue: string;
  envValue: string;
  labelValue: string[];
};

class SelectSearch extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      targetValue: '',
      envValue: '',
      inputValue: '',
      labelValue: [],
    };
    this.onChangeTarget = this.onChangeTarget.bind(this);
    this.handleChangName = this.handleChangName.bind(this);
    this.handleChangeLabel = this.handleChangeLabel.bind(this);
  }

  onChangeTarget(e: string) {
    this.setState(
      {
        targetValue: e,
      },
      () => {
        this.getApplications();
      }
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
      }
    );
  };

  handleChangeLabel(value: string[]) {
    const { setLabelValue } = this.props;
    let label = value ? value : [];
    setLabelValue(label);
    this.setState(
      {
        labelValue: label,
      },
      () => {
        this.getApplications();
      }
    );
  }

  handleClickSearch = () => {
    this.getApplications();
  };

  getApplications = async () => {
    const { targetValue, inputValue, envValue } = this.state;
    const params = {
      targetName: targetValue,
      query: inputValue,
      env: envValue,
    };
    this.props.listApplication(params);
  };

  onCreateApplication = () => {
    this.setState({
      targetValue: '',
      envValue: '',
      inputValue: '',
    });
    this.props.onAddApplication();
  };

  render() {
    const { targetList, envs, projectName, showMode, labelValue, appLabels } = this.props;
    const { targetValue, inputValue, envValue } = this.state;
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

    const labelSource = appLabels?.map((item) => {
      return {
        label: item,
        value: item,
      };
    });

    return (
      <Fragment>
        <Row className="project-select-wrapper border-radius-8 margin-top-20">
          <Col span="20">
            <Row wrap={true}>
              <Col xl={4} m={4} s={8} xxs={24} style={{ padding: '0 8px' }}>
                <Select
                  locale={locale().Select}
                  mode="single"
                  size="large"
                  onChange={this.onChangeEnv}
                  dataSource={envSource}
                  placeholder={i18n.t('Search by Environment')}
                  className="item"
                  hasClear
                  value={envValue}
                />
              </Col>
              <Col xl={4} m={4} s={8} xxs={24} style={{ padding: '0 8px' }}>
                <Select
                  locale={locale().Select}
                  mode="single"
                  size="large"
                  onChange={this.onChangeTarget}
                  dataSource={targetSource}
                  placeholder={i18n.t('Search by Target')}
                  className="item"
                  hasClear
                  value={targetValue}
                />
              </Col>
              <Col xl={8} m={8} s={16} xxs={24} style={{ padding: '0 8px' }}>
                <Select
                  hasClear
                  size="large"
                  placeholder={i18n.t('Search by Label Selector').toString()}
                  onChange={this.handleChangeLabel}
                  showSearch
                  mode="multiple"
                  value={labelValue}
                  className="item"
                  dataSource={labelSource}
                />
              </Col>
              <Col xl={4} m={8} s={8} xxs={24} style={{ padding: '0 8px' }}>
                <Input
                  innerAfter={<Icon type="search" size="xs" onClick={this.handleClickSearch} style={{ margin: 4 }} />}
                  hasClear
                  size="large"
                  placeholder={i18n.t('Search by Name and Description etc')}
                  onChange={this.handleChangName}
                  onPressEnter={this.handleClickSearch}
                  value={inputValue}
                  className="item"
                />
              </Col>
              <Col xl={4} s={8}>
                <div className="show-mode">
                  <Button.Group>
                    <Button
                      type={showMode == 'card' ? 'primary' : 'secondary'}
                      onClick={() => this.props.setMode('card')}
                    >
                      Card
                    </Button>
                    <Button
                      type={showMode == 'table' ? 'primary' : 'secondary'}
                      onClick={() => this.props.setMode('table')}
                    >
                      Table
                    </Button>
                  </Button.Group>
                </div>
              </Col>
            </Row>
          </Col>
          <Col span="4">
            <div className="show-mode">
              <Permission
                request={{ resource: `project:${projectName}/application:*`, action: 'create' }}
                project={projectName}
              >
                <Button className="create-btn-wrapper" type="primary" onClick={this.onCreateApplication}>
                  <Translation>New Application</Translation>
                </Button>
              </Permission>
            </div>
          </Col>
        </Row>
      </Fragment>
    );
  }
}

export default SelectSearch;
