import { getApplicationList, createApplicationList } from '../../api/application';

export default {
  namespace: 'application',
  state: {
    applicationList: [],
    projectList: [],
    clusterList: [],
    searchAppName: '',
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
  },
  effects: {
    *getApplicationList(action, { call, put }) {
      const result = yield call(getApplicationList);
      const appContent = getAppCardList(result || {});
      yield put({ type: 'updateApplicationList', payload: appContent });
    },
    *createApplicationList(action, { call, put }) {
      const result = yield call(createApplicationList, action.payload);
      yield put({ type: 'getApplicationList', payload: {} });
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
