import {
  getApplicationList,
  createApplicationList,
  getApplicationDetails,
  getApplicationComponents,
  getPolicyList,
  getComponentdefinitions,
} from '../api/application';

import { getNamespaceList } from '../api/namespace';

export default {
  namespace: 'application',
  state: {
    applicationPlanList: [],
    applicationPlanDetail: {},
    projectList: [],
    clusterList: [],
    searchAppName: '',
    namespaceList: [],
    components: [],
    componentDefinitions: [],
    componentDetails: {},
  },
  reducers: {
    update(state, { type, payload }) {
      return {
        ...state,
        searchAppName: payload,
      };
    },
    updateApplicationPlanList(state, { type, payload }) {
      return {
        ...state,
        applicationPlanList: payload,
      };
    },
    updateApplicationPlanDetail(state, { type, payload }) {
      return {
        ...state,
        applicationPlanDetail: payload,
      };
    },
    updateComponents(state, { type, payload }) {
      return {
        ...state,
        components: payload,
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
  },
  effects: {
    *getApplicationPlanList(action, { call, put }) {
      const result = yield call(getApplicationList, action.payload);
      const appContent = getAppCardList(result || {});
      yield put({ type: 'updateApplicationPlanList', payload: appContent });
      if (action.callback) {
        action.callback();
      }
    },
    *createApplicationPlan(action, { call, put }) {
      const result = yield call(createApplicationList, action.payload);
      if (action.callback && result) {
        action.callback(result);
      }
    },
    *getNamespaceList(action, { call, put }) {
      const result = yield call(getNamespaceList, action.payload);
      const namespaceList = getNamespace(result || {});
      yield put({ type: 'updateNameSpaceList', payload: namespaceList });
    },
    *getApplicationPlanDetail(action, { call, put }) {
      const { appPlanName } = action.payload;
      const result = yield call(getApplicationDetails, { name: appPlanName });
      yield put({ type: 'updateApplicationPlanDetail', payload: result });
      if (action.callback && result) {
        action.callback(result);
      }
    },
    *getApplicationComponents(action, { call, put }) {
      const result = yield call(getApplicationComponents, action.payload);
      yield put({ type: 'updateComponents', payload: result && result.componentplans });
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
