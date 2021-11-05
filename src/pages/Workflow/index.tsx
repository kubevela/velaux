import React, { Component } from 'react';
import { Link } from 'dva/router';
import { Button, Message, Grid, Search, Icon, Select, Step, Table, Breadcrumb } from '@b-design/ui';
import { connect } from 'dva';
import { WORFLOW_NODE_WIDTH } from './entity';
import WrokflowComponent from './workflow-component';
import { WorkFlowData } from './entity';
import {
  workflowSet,
  execuResult,
  dataSourceAppNames,
  MANAGER_TITLE,
  MANAGER_NAME,
} from './constants';

import './index.less';






type Props = {
  workflowList: Array<WorkFlowData>,
  dispatch: ({ }) => {},
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
  visible: boolean;
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
      visible: false,
    };
  }

  componentDidMount() { }
  handleSelect = (e: string) => {
    this.props.history.push(`/workflows/${e}`, {});
    this.setState({
      value: e,
    });
  };

  addWrokflow = () => {
    this.props.dispatch({
      type: 'workflow/addWrokflow'
    })
  }

  render() {
    const { value } = this.state;
    const { Row, Col } = Grid;
    const { workflowList, dispatch } = this.props;
    console.log(workflowList,'work');
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
          <div className="workflow-option-container">
            <Button type="secondary" className="first-btn">灰度发布</Button>
            <Button type="primary" onClick={this.addWrokflow}>新增部署流水线</Button>
          </div>
        </Row>
        {workflowList.map((workflow: WorkFlowData) =>
          <WrokflowComponent key={workflow.appName}
            data={workflow}
            dispatch={dispatch} />
        )}
      </div>
    );
  }
}

export default Workflow;
