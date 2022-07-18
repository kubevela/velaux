/* eslint-disable @typescript-eslint/no-unused-vars */
import _ from 'lodash';
import { listWorkFlow, createWorkFlow } from '../api/workflows';

const WORKFLOW_TEMPLATE = {
  appName: '',
  name: '',
  alias: '',
  description: '',
  option: {
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
    *getWorkflowList(action, { call, put }) {
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

    *setDefaultView(action, { call, put, select }) {
      const { name, isDefault } = action.payload;
      let { workflowList } = yield select((state) => state.workflow);
      workflowList = workflowList.map((workflow) => {
        if (workflow.name === name) {
          workflow.option.default = isDefault;
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
      Object.keys(nodes).map((key) => {
        if (nodes[key]) {
          let nodeConfig = Object.assign({}, nodes[key].consumerData);
          if (nodeConfig && nodeConfig.properties && typeof nodeConfig.properties != 'string') {
            nodeConfig = Object.assign(nodeConfig, {
              properties: JSON.stringify(nodeConfig.properties),
            });
          }
          nodeIndex[nodes[key].id] = nodeConfig;
        }
      });
      let next = edges.prev;
      let steps = [];
      let srcMap = {};
      Object.keys(edges).map((key) => {
        if (edges[key].src == 'prev') {
          next = edges[key];
        }
        srcMap[edges[key].src] = edges[key];
      });
      while (next != undefined) {
        if (next.dest && next.dest != 'next') {
          steps.push(nodeIndex[next.dest]);
          next = srcMap[next.dest];
        } else {
          next = undefined;
        }
      }
      workflow.steps = steps;
      yield call(createWorkFlow, workflow);
      if (action.callback) {
        action.callback();
      }
    },
  },
};

function transData(workflowList = [], appName) {
  const newWorkflows = _.cloneDeep(workflowList);
  if (newWorkflows && newWorkflows.length != 0) {
    newWorkflows.forEach((workflow) => {
      convertWorkflowStep(workflow, appName, 0);
    });
    return newWorkflows;
  } else {
    return [];
  }
}

export function convertWorkflowStep(workflow, appName, initPosition = 32, edit = false) {
  const nodeWidth = 200;
  const nodeHeight = 80;
  const nodeInterval = 120;
  const nodes = {};
  const edges = {};
  let position = initPosition;
  if (edit) {
    nodes.prev = {
      id: 'prev',
      typeId: 'prev',
      diagramMakerData: {
        position: {
          x: position,
          y: 130,
        },
        size: {
          width: nodeWidth,
          height: nodeHeight,
        },
        selected: false,
      },
    };
    position += nodeWidth + nodeInterval;
  }
  if (workflow.steps) {
    workflow.steps.forEach((item, index, array) => {
      edges[item.name] = {};
      if (workflow.steps && workflow.steps[index + 1]) {
        edges[item.name].dest = workflow.steps[index + 1].name;
      } else if (edit) {
        edges[item.name].dest = 'next';
      }
      edges[item.name].diagramMakerData = {
        selected: false,
      };
      edges[item.name].id = item.name;
      edges[item.name].src = workflow.steps && workflow.steps[index] && workflow.steps[index].name;

      nodes[item.name] = {};
      nodes[item.name].id = item.name;
      nodes[item.name].typeId = 'common';
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
    edges.prev = {
      dest: workflow.steps[0].name,
      src: 'prev',
      id: 'prev',
      diagramMakerData: {
        selected: false,
      },
    };
  }
  if (edit) {
    nodes.next = {
      id: 'next',
      typeId: 'next',
      diagramMakerData: {
        position: {
          x: position,
          y: 130,
        },
        size: {
          width: nodeWidth,
          height: nodeHeight,
        },
        selected: false,
      },
    };
  }
  workflow.appName = appName;
  workflow.option = {
    edit: false,
    default: workflow.default,
  };
  workflow.data = {
    edges: edges,
    nodes: nodes,
  };
}
