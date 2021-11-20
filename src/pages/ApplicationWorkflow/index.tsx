import React, { Component } from 'react';
import _ from 'lodash';
import { If } from 'tsx-control-statements/components';
import { Button } from '@b-design/ui';
import { connect } from 'dva';
import WrokflowComponent from './workflow-component';
import { WorkFlowData } from './entity';
import { getWorkFlowDefinitions } from '../../api/workflows';

import './index.less';

type Props = {
  workflowList: Array<WorkFlowData>;
  dispatch: ({}) => {};
  match: {
    params: {
      appName: string;
    };
  };
  history: {
    push: (path: string, state: {}) => {};
  };
};

type State = {
  appName: string;
  workFlowDefinitions: [];
};

@connect((store: any) => {
  return { ...store.workflow };
})
class Workflow extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    const { params } = this.props.match;
    this.state = {
      appName: params.appName || '',
      workFlowDefinitions: [],
    };
  }

  componentDidMount() {
    this.onGetWorkflow();
    this.onGetWorkFlowdefinitions();
  }

  onGetWorkflow = () => {
    this.props.dispatch({
      type: 'workflow/getWrokflowList',
      payload: {
        appName: this.state.appName,
      },
    });
  };

  onGetWorkFlowdefinitions = async () => {
    getWorkFlowDefinitions().then((res: any) => {
      if (res) {
        this.setState({
          workFlowDefinitions: res && res.definitions,
        });
      }
    });
  };

  handleSelect = (e: string) => {
    this.props.history.push(`/workflows/${e}`, {});
    this.setState({
      appName: e,
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
    const { workflowList, dispatch } = this.props;

    return (
      <div style={{ height: '100%' }} className="workflow-wraper">
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
              <WrokflowComponent
                key={workflow.name}
                appName={this.state.appName}
                data={workflow}
                workFlowDefinitions={this.state.workFlowDefinitions}
                getWorkflow={this.onGetWorkflow}
                dispatch={dispatch}
              />
            ))}
          </React.Fragment>
        </If>
      </div>
    );
  }
}

export default Workflow;
