import React, { Component } from 'react';
import { If } from 'tsx-control-statements/components';
import { Button } from '@b-design/ui';
import { connect } from 'dva';
import WrokflowComponent from './workflow-component';
import type { WorkFlowData } from './entity';
import { getWorkFlowDefinitions } from '../../api/workflows';

import './index.less';
import Translation from '../../components/Translation';

type Props = {
  workflowList: WorkFlowData[];
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

  addWrokflow = () => {};

  render() {
    const { workflowList, dispatch } = this.props;
    const { params } = this.props.match;
    return (
      <div style={{ height: '100%' }} className="workflow-wraper">
        <If condition={workflowList.length === 0}>
          <div className="empty-container">
            <div className="empty-word">
              <Translation>Please create workflow</Translation>
            </div>
            <Button type="primary" onClick={this.addWrokflow}>
              <Translation>New Workflow</Translation>
            </Button>
          </div>
        </If>
        <If condition={workflowList.length > 0}>
          <React.Fragment>
            {workflowList.map((workflow: WorkFlowData) => (
              <WrokflowComponent
                key={workflow.name + params.appName}
                appName={params.appName}
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
