import React, { Component } from 'react';
import { Link } from 'dva/router';
import { Breadcrumb, Select, Grid, Button, Card, Step } from '@b-design/ui';
import {
  dataSourceAppNames,
  MANAGER_TITLE,
  COMPONENT_NAME,
  MANAGER_NAME,
  componentsSourceNames,
  OVERVIEW,
} from './constants';
import TabsContent from './components/tabs-content/index';
import './index.less';

type Props = {
  match: {
    params: {
      appName: string;
      componentName: string;
    };
  };
  history: {
    push: (path: string, state: {}) => {};
  };
};

type State = {
  appName: string;
  componentName: string;
};

class ComponentDetails extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    const { params } = this.props.match;
    this.state = {
      appName: params.appName,
      componentName: params.componentName,
    };
  }
  componentDidMount() {}
  handleSelect = (e: string) => {
    const { componentName } = this.state;
    this.props.history.push(`/applications/${e}/components/${componentName}`, {});
    this.setState({
      appName: e,
    });
  };

  handleSelectComponent = (e: string) => {
    const { appName } = this.state;
    this.props.history.push(`/applications/${appName}/components/${e}`, {});
    this.setState({
      componentName: e,
    });
  };

  render() {
    const { appName, componentName } = this.state;
    const { Row, Col } = Grid;
    return (
      <div className="details">
        <Row className="breadcrumb-wraper">
          <Col span="24">
            <Breadcrumb separator="/">
              <Breadcrumb.Item link="javascript:void(0);">
                <Link to={'/'}> {MANAGER_TITLE} </Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item link="javascript:void(0);">
                <Select
                  dataSource={dataSourceAppNames}
                  value={appName}
                  onChange={this.handleSelect}
                />
              </Breadcrumb.Item>
              <Breadcrumb.Item link="javascript:void(0);">
                <Select
                  dataSource={componentsSourceNames}
                  value={componentName}
                  onChange={this.handleSelectComponent}
                />
              </Breadcrumb.Item>
              <Breadcrumb.Item>{OVERVIEW}</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
        </Row>
        <Row className="tabs-wraper">
          <h2 className="padding-left-15">总览</h2>
          <TabsContent />
        </Row>
      </div>
    );
  }
}

export default ComponentDetails;
