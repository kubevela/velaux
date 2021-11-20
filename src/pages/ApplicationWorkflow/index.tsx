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

  transData = (workflowList: Array<WorkFlowData>) => {
    if (workflowList && workflowList.length != 0) {
      const nodes: any = {};
      const edges: any = {};
      let position = 50;
      workflowList.forEach((key: WorkFlowData) => {
        key.steps &&
          key.steps.forEach((item, index, array) => {
            position += 200;
            edges[item.name] = {};
            edges[item.name]['dest'] = key.steps && key.steps[index].name;
            edges[item.name]['dest'] = key.steps && key.steps[index].name;
            edges[item.name]['diagramMakerData'] = {
              selected: false,
            };
            edges[item.name]['id'] = item.name;
            edges[item.name]['src'] =
              key.steps && key.steps[index - 1] && key.steps[index - 1].name;

            nodes[item.name] = {};
            nodes[item.name]['id'] = item.name;
            nodes[item.name]['typeId'] = item.type;
            nodes[item.name]['consumerData'] = {
              name: item.name,
              type: item.type,
            };
            nodes[item.name]['diagramMakerData'] = {
              position: {
                x: position,
                y: 100,
              },
              size: {
                width: 120,
                height: 40,
              },
              selected: false,
            };
          });

        key['data'] = {
          edges: edges,
          nodes: nodes,
        };
      });

      // const pp = [{
      //   "appName": "web2",
      //   "name": "app1",
      //   "alias": "app1",
      //   "description": "app description",
      //   "option": {
      //       "enable": true,
      //       "default": true,
      //       "edit": true
      //   },
      //   data:{
      //     edges:edges,
      //     nodes:nodes
      //   }
      // }]

      // console.log('nodes', nodes);
      // console.log('edges', edges)
      // console.log('pp',pp)
      // return pp;
    }
  };

  render() {
    const { workflowList, dispatch } = this.props;
    console.log('workflowList', workflowList);
    console.log('workFlowDefinitions', this.state.workFlowDefinitions);

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
