/* eslint-disable @typescript-eslint/no-unused-vars */

export default {
  namespace: 'uischema',
  state: {
    appNamespace: '',
    appName: '',
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
  },
};
