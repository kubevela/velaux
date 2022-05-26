import React, { Fragment } from 'react';
import { Grid, Icon, Select, Input, Button } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import locale from '../../../../utils/locale';
import type { Target } from '../../../../interface/target';
import type { Env } from '../../../../interface/env';
import i18n from '../../../../i18n';
import Translation from '../../../../components/Translation';
import Permission from '../../../../components/Permission';
import './index.less';

const { Row, Col } = Grid;

type Props = {
  targetList?: Target[];
  envs?: Env[];
  listApplication: (params: any) => void;
  onAddApplication: () => void;
  projectName?: string;
};

type State = {
  targetValue: string;
  inputValue: string;
  envValue: string;
};

class SelectSearch extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      targetValue: '',
      envValue: '',
      inputValue: '',
    };
    this.onChangeTarget = this.onChangeTarget.bind(this);
    this.handleChangName = this.handleChangName.bind(this);
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
    const { targetList, envs, projectName } = this.props;
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
    return (
      <Fragment>
        <Row className="project-select-wrapper border-radius-8 margin-top-20">
          <Col span="20">
            <Row wrap={true}>
              <Col xl={6} m={8} s={12} xxs={24} style={{ padding: '0 8px' }}>
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
              <Col xl={6} m={8} s={12} xxs={24} style={{ padding: '0 8px' }}>
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
                  placeholder={i18n.t('Search by name and description etc')}
                  onChange={this.handleChangName}
                  onPressEnter={this.handleClickSearch}
                  value={inputValue}
                  className="item"
                />
              </Col>
            </Row>
          </Col>
          <Col span="4">
            <Permission
              request={{ resource: `project:${projectName}/application:*`, action: 'create' }}
              project={projectName}
            >
              <Button
                className="create-btn-wrapper"
                type="primary"
                onClick={this.onCreateApplication}
              >
                <Translation>New Application</Translation>
              </Button>
            </Permission>
          </Col>
        </Row>
      </Fragment>
    );
  }
}

export default withTranslation()(SelectSearch);
