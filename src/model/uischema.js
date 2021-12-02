/* eslint-disable @typescript-eslint/no-unused-vars */

export default {
  namespace: 'uischema',
  state: {
    appNamespace: '',
    appName: '',
  },
  reducers: {
    setAppName(state, { type, payload }) {
      return {
        ...state,
        appName: payload,
      };
    },
    setAppNamespace(state, { type, payload }) {
      return {
        ...state,
        appNamespace: payload,
      };
    },
  },
  effects: {
    *setAppName(action, { call, put }) {
      if (result) {
        yield put({ type: 'setAppName', payload: action.payload || [] });
      }
    },
    *setAppNamespace(action, { call, put }) {
      if (result) {
        yield put({ type: 'setAppNamespace', payload: action.payload || [] });
      }
    },
  },
};
