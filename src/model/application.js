import {
  getApplicationList,
  createApplication,
  getApplicationDetails,
  getApplicationStatus,
  getApplicationComponents,
  getPolicyList,
  getComponentdefinitions,
  getApplicationEnvbinding,
} from '../api/application';

import { listWorkFlow } from '../api/workflows';

import { getNamespaceList } from '../api/namespace';

export default {
  namespace: 'application',
  state: {
    applicationList: [],
    applicationDetail: {},
    applicationStatus: {},
    projectList: [],
    clusterList: [],
    searchAppName: '',
    namespaceList: [],
    components: [],
    componentDefinitions: [],
    componentDetails: {},
    envbinding: [],
    workflows: [],
  },
  reducers: {
    update(state, { type, payload }) {
      return {
        ...state,
        searchAppName: payload,
      };
    },
    updateApplicationList(state, { type, payload }) {
      return {
        ...state,
        applicationList: payload,
      };
    },
    updateApplicationDetail(state, { type, payload }) {
      return {
        ...state,
        applicationDetail: payload,
      };
    },
    updateApplicationEnvbinding(state, { type, payload }) {
      return {
        ...state,
        envbinding: payload.envBindings || [],
      };
    },
    updateApplicationStatus(state, { type, payload }) {
      return {
        ...state,
        applicationStatus: payload.status,
      };
    },
    updateComponents(state, { type, payload }) {
      return {
        ...state,
        components: payload.components,
        componentsApp: payload.componentsApp,
      };
    },
    updateNameSpaceList(state, { type, payload }) {
      return {
        ...state,
        namespaceList: payload,
      };
    },
    updatePoliciesList(state, { type, payload }) {
      return {
        ...state,
        namespaceList: payload,
      };
    },
    updateComponentDefinitions(state, { type, payload }) {
      return {
        ...state,
        componentDefinitions: payload,
      };
    },
    updateComponentDetails(state, { type, payload }) {
      return {
        ...state,
        componentDetails: payload,
      };
    },
    updateWorkflow(state, { type, payload }) {
      return {
        ...state,
        workflows: payload || [],
      };
    },
  },
  effects: {
    *getApplicationList(action, { call, put }) {
      const result = yield call(getApplicationList, action.payload);
      const appContent = getAppCardList(result || {});
      yield put({ type: 'updateApplicationList', payload: appContent });
      if (action.callback && appContent) {
        action.callback(appContent);
      }
    },
    *createApplicationPlan(action, { call, put }) {
      const result = yield call(createApplication, action.payload);
      if (action.callback && result) {
        action.callback(result);
      }
    },
    *getNamespaceList(action, { call, put }) {
      const result = yield call(getNamespaceList, action.payload);
      const namespaceList = getNamespace(result || {});
      yield put({ type: 'updateNameSpaceList', payload: namespaceList });
    },
    *getApplicationDetail(action, { call, put }) {
      const { appName } = action.payload;
      const result = yield call(getApplicationDetails, { name: appName });
      yield put({ type: 'updateApplicationDetail', payload: result });
      if (action.callback && result) {
        action.callback(result);
      }
    },
    *getApplicationEnvbinding(action, { call, put }) {
      const { appName } = action.payload;
      const result = yield call(getApplicationEnvbinding, { appName: appName });
      yield put({ type: 'updateApplicationEnvbinding', payload: result });
      if (action.callback && result) {
        action.callback(result);
      }
    },
    *getApplicationStatus(action, { call, put }) {
      const { appName, envName } = action.payload;
      const result = yield call(getApplicationStatus, { name: appName, envName: envName });
      yield put({ type: 'updateApplicationStatus', payload: result });
      if (action.callback) {
        action.callback(result);
      }
    },
    *getApplicationComponents(action, { call, put }) {
      const result = yield call(getApplicationComponents, action.payload);
      yield put({
        type: 'updateComponents',
        payload: { components: result && result.components, componentsApp: action.payload.appName },
      });
    },
    *getPolicies(action, { call, put }) {
      const { urlParam } = action.payload;
      const result = yield call(getPolicyList, { name: urlParam });
      yield put({ type: 'updatePoliciesList', payload: result });
    },
    *getComponentdefinitions(action, { call, put }) {
      const { urlParam } = action.payload;
      const result = yield call(getComponentdefinitions, { envName: urlParam });
      yield put({
        type: 'updateComponentDefinitions',
        payload: result && result.definitions,
      });
    },
    *getApplicationWorkflows(action, { call, put }) {
      const result = yield call(listWorkFlow, action.payload);
      yield put({
        type: 'updateWorkflow',
        payload: result.workflows,
      });
    },
  },
};

export function getAppCardList(data) {
  const applicationsList = data.applications;
  if (!applicationsList) {
    return [];
  }
  const appContent = [];
  for (const item of applicationsList) {
    const app = {
      name: item.name,
      alias: item.alias,
      status: item.status,
      icon: item.icon,
      description: item.description,
      createTime: item.createTime,
      rules: item.rules,
    };
    appContent.push(app);
  }
  return appContent;
}

function getNamespace(data) {
  const namespacesList = data.namespaces;
  if (!namespacesList) {
    return [];
  }
  const list = [];
  for (const item of namespacesList) {
    const namespace = {};
    namespace.value = item.name;
    namespace.label = item.name;
    list.push(namespace);
  }
  return list;
}
