import { act } from 'react-dom/test-utils';
import {
  getApplicationList,
  createApplicationList,
  getApplicationDetails,
  getApplicationComponents,
} from '../api/application';

import { getNamespaceList } from '../api/namespace';

export default {
  namespace: 'application',
  state: {
    applicationList: [],
    projectList: [],
    clusterList: [],
    searchAppName: '',
    namespaceList: [],
    applicationDetail: {},
    topologyData: {},
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
    updateApplicationDetails(state, { type, payload }) {
      return {
        ...state,
        applicationDetail: payload,
      };
    },
    updateTopology(state, { type, payload }) {
      return {
        ...state,
        topologyData: payload,
      };
    },
    updateNameSpaceList(state, { type, payload }) {
      return {
        ...state,
        namespaceList: payload,
      };
    },
  },
  effects: {
    *getApplicationList(action, { call, put }) {
      const result = yield call(getApplicationList, action.payload);
      const appContent = getAppCardList(result || {});
      yield put({ type: 'updateApplicationList', payload: appContent });
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
    *getApplicationDetails(action, { call, put }) {
      const { urlParam } = action.payload;
      const result = yield call(getApplicationDetails, { name: urlParam });
      yield put({ type: 'updateApplicationDetails', payload: result });
    },
    *getApplicationComponents(action, { call, put }) {
      const { urlParam } = action.payload;
      const result = yield call(getApplicationComponents, { name: urlParam });
      yield put({ type: 'updateTopology', payload: result });
    },
  },
};

function getAppCardList(data) {
  const applicationsList = data.applicationplans;
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
