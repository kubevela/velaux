import React, { Component } from 'react';
import { Link } from 'dva/router';
import { Grid, Breadcrumb, Select, Button } from '@b-design/ui';
import {
  MANAGER_TITLE,
  OVERVIEW,
  PUBLISH_APPLICATION_TEMPLATE,
  DEPLOYMENT_UPDATE,
} from '../../constants';
import { transSelectConfig } from '../../../../utils/common';

type Props = {
  applicationList: [];
  appName: string;
  history: {
    push: (path: string, state: {}) => {};
  };
  getApplicationDetails: () => void;
  changeAppName: (name: string) => void;
  setVisible: (visible: boolean) => void;
};


class Title extends Component<Props> {
  handleSelect = (name: string) => {
    this.props.changeAppName(name);
  };

  render() {
    const { Row, Col } = Grid;
    const { applicationList } = this.props;
    const { appName } = this.props;
    const APPTitleSlect = transSelectConfig(applicationList, 'name');
    return (
      <Row className="breadcrumb-wraper">
        <Col span="17">
          <Breadcrumb separator="/">
            <Breadcrumb.Item link="javascript:void(0);">
              <Link to={'/'}> {MANAGER_TITLE} </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item link="javascript:void(0);">
              <Select dataSource={APPTitleSlect} value={appName} onChange={this.handleSelect} />
            </Breadcrumb.Item>
            <Breadcrumb.Item>{OVERVIEW}</Breadcrumb.Item>
          </Breadcrumb>
        </Col>
        <Col span="7">
          <div className="title-nav-button">
            <Button
              type="secondary"
              onClick={() => {
                this.props.setVisible(true);
              }}
            >
              {PUBLISH_APPLICATION_TEMPLATE}
            </Button>
            <Button type="primary" className="margin-left-15">
              {DEPLOYMENT_UPDATE}
            </Button>
          </div>
        </Col>
      </Row>
    );
  }
}

export default Title;
