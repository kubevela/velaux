import React, { Component } from 'react';
import { connect } from 'dva';
import { If } from 'tsx-control-statements/components';
import { Grid } from '@b-design/ui';
import Title from '../../components/ListTitle';
import Menu from './components/Menu';
import Empty from '../../components/Empty';
import type { ConfigTemplate } from '../../interface/configs';
import { getMatchParamObj } from '../../utils/utils';
import './index.less';

type Props = {
  activeName: string;
  configTemplates: ConfigTemplate[];
  history: {
    push: (path: string, state?: {}) => {};
  };
  location: {
    pathname: string;
  };
  match: {
    params: {
      templateName: string;
    };
    path: string;
  };
  dispatch: ({}) => {};
};

type State = {
  activeName: string;
};
@connect((store: any) => {
  return { ...store.configs };
})
class ConfigsLayout extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      activeName: this.getTemplateName(),
    };
  }

  componentDidMount() {
    this.listTemplates();
  }

  componentWillReceiveProps(nextProps: Props) {
    const { configTemplates } = nextProps;
    if (nextProps.location.pathname != this.props.location.pathname) {
      const nextPropsParams = nextProps.match.params || {};
      this.setState({
        activeName: nextPropsParams.templateName,
      });
    }

    if (nextProps.match.path === '/configs' && configTemplates.length != 0) {
      const pathname = this.getConfigsFirstMenuName(configTemplates);
      this.initMenuRoute(pathname);
    }
  }

  listTemplates = () => {
    this.props.dispatch({
      type: 'configs/loadTemplates',
      payload: {},
    });
  };

  getTemplateName = () => {
    return getMatchParamObj(this.props.match, 'templateName');
  };

  getConfigsFirstMenuName = (data: ConfigTemplate[]) => {
    return (data && data[0] && data[0].name) || '';
  };

  initMenuRoute = (pathname: string) => {
    if (pathname) {
      const link = `/configs/${pathname}`;
      this.props.history.push(link);
    }
  };

  render() {
    const { Row, Col } = Grid;
    const { configTemplates } = this.props;
    const { activeName } = this.state;
    return (
      <div className="configs-wrapper">
        <Title
          title={'Configs'}
          subTitle={'Provide templated, extensibility configuration management capabilities.'}
        />
        <If condition={!activeName}>
          <Empty style={{ marginTop: '40px' }} />
        </If>
        <If condition={activeName}>
          <Row>
            <Col span="5">
              <Menu activeName={activeName} menuData={configTemplates} />
            </Col>
            <Col span="19">{this.props.children}</Col>
          </Row>
        </If>
      </div>
    );
  }
}

export default ConfigsLayout;
