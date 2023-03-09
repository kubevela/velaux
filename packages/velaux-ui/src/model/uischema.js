/* eslint-disable @typescript-eslint/no-unused-vars */

export default {
  namespace: 'uischema',
  state: {
    appNamespace: '',
    appName: '',
    project: '',
    repo: { secretName: '', url: '' },
  },
  reducers: {
    updateAppName(state, { type, payload }) {
      return {
        ...state,
        appName: payload,
      };
    },
    updateAppNamespace(state, { type, payload }) {
      return {
        ...state,
        appNamespace: payload,
      };
    },
    updateHelmRepo(state, { type, payload }) {
      return {
        ...state,
        repo: payload,
      };
    },
    updateProject(state, { type, payload }) {
      return {
        ...state,
        project: payload,
      };
    },
  },
  effects: {
    *setAppName(action, { call, put }) {
      if (action.payload) {
        yield put({ type: 'updateAppName', payload: action.payload || '' });
      }
    },
    *setAppNamespace(action, { call, put }) {
      if (action.payload) {
        yield put({ type: 'updateAppNamespace', payload: action.payload || '' });
      }
    },
    *setProject(action, { call, put }) {
      if (action.payload) {
        yield put({ type: 'updateProject', payload: action.payload || '' });
      }
    },
    *setHelmRepo(action, { call, put }) {
      if (action.payload) {
        yield put({ type: 'updateHelmRepo', payload: action.payload || '' });
      }
    },
  },
};
