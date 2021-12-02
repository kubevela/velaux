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
      const name = `workflow${workflowList.length + 1}`;
      newData.appName = appName;
      newData.name = name;
      newData.alias = name;
      newData.description = 'workflow description';
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
      const nodeIndex = {};
      let index = 0;
      const steps = Object.keys(nodes).map((key) => {
        if (nodes[key]) {
          nodeIndex[nodes[key].id] = index;
          index++;
          const nodeConfig = nodes[key].consumerData;
          if (nodeConfig && nodeConfig.properties && typeof nodeConfig.properties != 'string') {
            return Object.assign(nodeConfig, { properties: JSON.stringify(nodeConfig.properties) });
          }
          return nodeConfig;
        }
      });
      Object.keys(edges).map((key) => {
        const edge = edges[key];
        if (nodeIndex[edge.src] > nodeIndex[edge.dest]) {
          const i = steps[nodeIndex[edge.src]];
          const oldIndex = nodeIndex[edge.src];
          steps[nodeIndex[edge.src]] = steps[nodeIndex[edge.dest]];
          steps[nodeIndex[edge.dest]] = i;
          nodeIndex[edge.src] = nodeIndex[edge.dest];
          nodeIndex[edge.dest] = oldIndex;
        }
      });
      Object.keys(edges).map((key) => {
        const edge = edges[key];
        if (nodeIndex[edge.src] > nodeIndex[edge.dest]) {
          const i = steps[nodeIndex[edge.src]];
          const oldIndex = nodeIndex[edge.src];
          steps[nodeIndex[edge.src]] = steps[nodeIndex[edge.dest]];
          steps[nodeIndex[edge.dest]] = i;
          nodeIndex[edge.src] = nodeIndex[edge.dest];
          nodeIndex[edge.dest] = oldIndex;
        }
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
  if (newData && newData.length != 0) {
    newData.forEach((key) => {
      convertWorkflowStep(key, appName, 32);
    });
    return newData;
  } else {
    return [];
  }
}

export function convertWorkflowStep(workflowStep, appName, initPosition = 32) {
  const nodeWidth = 140;
  const nodeHeight = 40;
  const nodeInterval = 80;
  const nodes = {};
  const edges = {};
  let position = initPosition;
  if (workflowStep.steps) {
    workflowStep.steps.forEach((item, index, array) => {
      edges[item.name] = {};
      edges[item.name].dest =
        workflowStep.steps && workflowStep.steps[index + 1] && workflowStep.steps[index + 1].name;
      edges[item.name].diagramMakerData = {
        selected: false,
      };
      edges[item.name].id = item.name;
      edges[item.name].src =
        workflowStep.steps && workflowStep.steps[index] && workflowStep.steps[index].name;

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
          y: 130,
        },
        size: {
          width: nodeWidth,
          height: nodeHeight,
        },
        selected: false,
      };
      position += nodeWidth + nodeInterval;
    });
  }

  workflowStep.appName = appName;
  workflowStep.option = {
    edit: false,
    enable: false,
    default: workflowStep.default,
  };
  workflowStep.data = {
    edges: edges,
    nodes: nodes,
  };
}
