import React, { Component } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { DragDropContext } from 'react-dnd';
import HTMLBackend from 'react-dnd-html5-backend';
import { Breadcrumb, Select, Grid, Button, Card, Step } from '@b-design/ui';
import {
  dataSourceAppNames,
  MANAGER_TITLE,
  MANAGER_NAME,
  componGroups,
  OVERVIEW,
  DEPLOYMENT_UPDATE,
  PUBLISH_MODEL,
  DEPLOYED,
  VIEW_DETAILS,
} from './constants';
import TabsContent from './components/tabs-content/index';
import ComponentsGroup from './components/components-group';
import PublishDialog from './components/publish-dialog';
import './index.less';

type Props = {
  match: {
    params: {
      appName: string;
    };
  };
  history: {
    push: (path: string, state: {}) => {};
  };
  dispatch: ({}) => {};
};

type State = {
  value: string;
  visible: boolean;
};
@DragDropContext(HTMLBackend)
@connect((store: any) => {
  return { ...store.application };
})
class General extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { params } = this.props.match;
    this.state = {
      value: params.appName,
      visible: false,
    };
  }

  componentDidMount() {
    this.getApplicationDetails();
    this.getApplicationComponents();
  }

  getApplicationDetails = async () => {
    const { value } = this.state;
    this.props.dispatch({
      type: 'application/getApplicationDetails',
      payload: {
        urlParam: value,
      },
    });
  };

  getApplicationComponents = async () => {
    const { value } = this.state;
    this.props.dispatch({
      type: 'application/getApplicationComponents',
      payload: {
        urlParam: value,
      },
    });
  };

  handleSelect = (e: string) => {
    this.props.history.push(`/applications/${e}`, {});
    this.setState(
      {
        value: e,
      },
      () => {
        this.getApplicationDetails();
      },
    );
  };

  setVisible = (visible: boolean) => {
    this.setState({ visible });
  };

  render() {
    const { value, visible } = this.state;
    const { Row, Col } = Grid;
    const steps = ['step1', 'step2', 'step3', 'step4', 'step5'].map((item, index) => (
      <Step.Item key={index} title={item} />
    ));
    const dataSource = (i: number, j: number) => {
      return [
        {
          status: '审核ing',
          number: 0,
        },
        {
          status: '审核ing',
          number: 1,
        },
      ];
    };

    return (
      <div className="general">
        <Row className="breadcrumb-wraper">
          <Col span="17">
            <Breadcrumb separator="/">
              <Breadcrumb.Item link="javascript:void(0);">
                <Link to={'/'}> {MANAGER_TITLE} </Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item link="javascript:void(0);">
                <Select
                  dataSource={dataSourceAppNames}
                  value={value}
                  onChange={this.handleSelect}
                />
              </Breadcrumb.Item>
              <Breadcrumb.Item>{OVERVIEW}</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
          <Col span="7">
            <div className="title-nav-button">
              <Button
                type="secondary"
                onClick={() => {
                  this.setVisible(true);
                }}
              >
                {PUBLISH_MODEL}
              </Button>
              <Button type="primary" className="margin-left-15">
                {DEPLOYMENT_UPDATE}
              </Button>
            </div>
          </Col>
        </Row>
        <Row className="card-content-wraper margin-top-10">
          <Col span="12">
            <Card>
              <div className="card-content">
                <div className="title">{MANAGER_TITLE}</div>
                <div className="deployment">{DEPLOYED}</div>
              </div>
              <div className="padding-left-15">
                {' '}
                Policies:<Button> health</Button>{' '}
              </div>
            </Card>
          </Col>
          <Col span="12">
            <div className="step-wraper">
              <div className="nav">
                <div className="title"> Workflow</div>
                <div className="detail">
                  <Link to={`/workflows/${value}`}> {VIEW_DETAILS} </Link>
                </div>
              </div>
              <Step current={1} shape="circle">
                {steps}
              </Step>
            </div>
          </Col>
        </Row>
        <Row className="tabs-wraper">
          <TabsContent />
        </Row>
        <Row className="components-wraper">
          {componGroups.map((item) => (
            <ComponentsGroup name={item.title} />
          ))}
        </Row>
        <PublishDialog
          visible={visible}
          setVisible={(visible) => {
            this.setVisible(visible);
          }}
        />
      </div>
    );
  }
}

export default General;
