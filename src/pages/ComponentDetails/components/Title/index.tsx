import React, { Component } from 'react';
import { Link } from 'dva/router';
import { Breadcrumb, Select, Grid, Button, Card, Step } from '@b-design/ui';
import { MANAGER_TITLE, OVERVIEW } from '../../constants';

type Props = {
  appName: string;
  componentName: string;
  applicationList: [];
  components: [];
  history: {
    push: (path: string, state: {}) => {};
  };
  changeAppNamne: (value: string) => void;
  changeComponentName: (value: string) => void;
};

type State = {
  appName: string;
  componentName: string;
};

class Title extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      appName: props.appName,
      componentName: props.componentName,
    };
  }

  handleSelect = (value: string) => {
    this.props.changeAppNamne(value);
  };

  handleSelectComponent = (value: string) => {
    this.props.changeComponentName(value);
  };

  transTODadaSource = (data: []) => {
    return (data || []).map((item: { name: string }) => ({ lable: item.name, value: item.name }));
  };

  render() {
    const { Row, Col } = Grid;
    const { applicationList, components } = this.props;
    const { appName, componentName } = this.state;

    return (
      <Row className="breadcrumb-wraper">
        <Col span="24">
          <Breadcrumb separator="/">
            <Breadcrumb.Item link="javascript:void(0);">
              <Link to={'/'}> {MANAGER_TITLE} </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item link="javascript:void(0);">
              <Select
                dataSource={this.transTODadaSource(applicationList)}
                value={appName}
                onChange={this.handleSelect}
              />
            </Breadcrumb.Item>
            <Breadcrumb.Item link="javascript:void(0);">
              <Select
                dataSource={this.transTODadaSource(components)}
                value={componentName}
                onChange={this.handleSelectComponent}
              />
            </Breadcrumb.Item>
            <Breadcrumb.Item>{OVERVIEW}</Breadcrumb.Item>
          </Breadcrumb>
        </Col>
      </Row>
    );
  }
}

export default Title;
