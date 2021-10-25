import { act } from 'react-dom/test-utils';
import {
  getApplicationList,
  createApplicationList,
  getApplicationDetails,
  getApplicationComponents,
} from '../../api/application';

import { getNamespaceList } from '../../api/namespace';

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
    *createApplicationList(action, { call, put }) {
      const result = yield call(createApplicationList, action.payload);
      yield put({ type: 'getApplicationList', payload: {} });
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
  const applicationsList = data.applications;
  if (applicationsList === null) {
    return [];
  }
  const appContent = [];
  for (const item of applicationsList) {
    const rules = item.gatewayRule && item.gatewayRule[0];
    const { protocol = '', address = '', componentPort = '' } = rules || {};
    const href = protocol + address + componentPort;
    const app = {
      name: item.name,
      status: item.status,
      icon: item.icon,
      description: item.description,
      createTime: item.createTime,
      btnContent: item.btnContent,
      href: href,
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
