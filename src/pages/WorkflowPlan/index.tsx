import React, { Component } from 'react';
import _ from 'lodash';
import { Link } from 'dva/router';
import { If } from 'tsx-control-statements/components';
import { Button, Message, Grid, Search, Icon, Select, Step, Table, Breadcrumb } from '@b-design/ui';
import { connect } from 'dva';
import WrokflowComponent from './workflow-component';
import { WorkFlowData } from './entity';
import { dataSourceAppNames, MANAGER_TITLE } from './constants';

import './index.less';

type Props = {
  workflowList: Array<WorkFlowData>;
  dispatch: ({}) => {};
  match: {
    params: {
      workflowName: string;
    };
  };
  history: {
    push: (path: string, state: {}) => {};
  };
};

type State = {
  value: string;
};

@connect((store: any) => {
  return { ...store.workflow };
})
class Workflow extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    const { params } = this.props.match;
    this.state = {
      value: params.workflowName,
    };
  }

  componentDidMount() {}
  handleSelect = (e: string) => {
    this.props.history.push(`/workflows/${e}`, {});
    this.setState({
      value: e,
    });
  };

  addWrokflow = () => {
    const appName = _.get(this, 'props.match.params.workflowName', ''); // 获取appName
    this.props.dispatch({
      type: 'workflow/addWrokflow',
      payload: {
        appName,
      },
    });
  };

  render() {
    const { value } = this.state;
    const { Row, Col } = Grid;
    const { workflowList, dispatch } = this.props;
    return (
      <div style={{ height: '100%' }} className="workflow-wraper">
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
              <Breadcrumb.Item>{'workflow设置'}</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
          <If condition={workflowList.length > 0}>
            <div className="workflow-option-container">
              <Button type="secondary" className="first-btn">
                灰度发布
              </Button>
              <Button type="primary" onClick={this.addWrokflow}>
                新增部署流水线
              </Button>
            </div>
          </If>
        </Row>
        <If condition={workflowList.length === 0}>
          <div className="empty-container">
            <div className="empty-word">您还没有创建流水线，请先创建</div>
            <Button type="primary" onClick={this.addWrokflow}>
              新增部署流水线
            </Button>
          </div>
        </If>
        <If condition={workflowList.length > 0}>
          <React.Fragment>
            {workflowList.map((workflow: WorkFlowData) => (
              <WrokflowComponent key={workflow.appName} data={workflow} dispatch={dispatch} />
            ))}
          </React.Fragment>
        </If>
      </div>
    );
  }
}

export default Workflow;
