/* eslint-disable @typescript-eslint/no-unused-vars */
import _ from 'lodash';
import { listWorkFlow, createWorkFlow } from '../api/workflows';

const WORKFLOW_TEMPLATE = {
  appName: '',
  name: '',
  alias: '',
  description: '',
  option: {
    enable: true,
    default: true,
    edit: true,
  },
  data: {
    nodes: {},
    edges: {},
  },
};
export default {
  namespace: 'workflow',
  state: {
    workflowList: [],
  },
  reducers: {
    updateWorkflow(state, { type, payload }) {
      const { workflowList } = payload;
      return {
        ...state,
        workflowList,
      };
    },
  },
  effects: {
    *getWrokflowList(action, { call, put }) {
      const result = yield call(listWorkFlow, action.payload);
      yield put({
        type: 'updateWorkflow',
        payload: {
          workflowList: transData(result && result.workflows, action.payload.appName),
        },
      });
    },

    *removeWorkflow(action, { call, put, select }) {
      const { name } = action.payload;
      let { workflowList } = yield select((state) => state.workflow);
      workflowList = workflowList.filter((workflow) => workflow.name !== name);
      yield put({ type: 'updateWorkflow', payload: { workflowList } });
    },

    *setEditView(action, { call, put, select }) {
      const { name, edit, workFlowDefinitions } = action.payload;

      let { workflowList } = yield select((state) => state.workflow);

      workflowList = workflowList.map((workflow) => {
        if (workflow.name === name) {
          workflow.option.edit = edit;
          workflow.workFlowDefinitions = workFlowDefinitions;
        }
        return workflow;
      });
      yield put({ type: 'updateWorkflow', payload: { workflowList } });
    },

    *addWrokflow(action, { call, put, select }) {
      let { workflowList } = yield select((state) => state.workflow);
      const { appName } = action.payload;
      const newData = _.cloneDeepWith(WORKFLOW_TEMPLATE);
      const name = `app${workflowList.length + 1}`;
      newData.appName = appName;
      newData.name = name;
      newData.alias = name;
      newData.description = 'app description';
      workflowList = workflowList.concat([newData]);
      yield put({ type: 'updateWorkflow', payload: { workflowList } });
    },

    *saveWorkflow(action, { call, put, select }) {
      const originWorkflow = action.payload;
      (originWorkflow.option || {}).edit = false;
      const {
        alias,
        appName,
        name,
        description,
        envName = 'pod',
        option = {},
        data,
      } = originWorkflow;
      const workflow = { alias, appName, name, description, envName };
      workflow.enable = option.enable;
      workflow.default = option.default;
      const { nodes, edges } = data;
      const steps = Object.keys(nodes).map((key) => {
        let dependsOn = [];
        const consumerData = nodes[key].consumerData || {};
        if (consumerData.properties && typeof consumerData.properties != 'string') {
          nodes[key].consumerData.properties = JSON.stringify(nodes[key].consumerData.properties);
        }
        return nodes[key].consumerData;
      });
      workflow.steps = steps;
      yield call(createWorkFlow, workflow);
      if (action.callback) {
        action.callback();
      }
    },
  },
};

function transData(workflowList = [], appName) {
  const newData = _.cloneDeep(workflowList);
  const nodeWidth = 200;
  const nodeInterval = 80;
  if (newData && newData.length != 0) {
    newData.forEach((key) => {
      const nodes = {};
      const edges = {};
      let position = 50;
      if (key.steps) {
        key.steps.forEach((item, index, array) => {
          position += nodeWidth + nodeInterval;
          edges[item.name] = {};
          edges[item.name].dest = key.steps && key.steps[index + 1] && key.steps[index + 1].name;
          edges[item.name].diagramMakerData = {
            selected: false,
          };
          edges[item.name].id = item.name;
          edges[item.name].src = key.steps && key.steps[index] && key.steps[index].name;

          nodes[item.name] = {};
          nodes[item.name].id = item.name;
          nodes[item.name].typeId = item.type;
          nodes[item.name].consumerData = {
            alias: item.alias || '',
            dependsOn: null,
            description: item.description || '',
            name: item.name || '',
            properties: item.properties || '',
            type: item.type || '',
          };
          nodes[item.name].diagramMakerData = {
            position: {
              x: position,
              y: 100,
            },
            size: {
              width: nodeWidth,
              height: 40,
            },
            selected: false,
          };
        });
      }
      key.envName = key.envName;
      key.appName = appName;
      key.option = {
        edit: false,
        enable: false,
        default: key.default,
      };
      key.data = {
        edges: edges,
        nodes: nodes,
      };
    });
    return newData;
  } else {
    return [];
  }
}
