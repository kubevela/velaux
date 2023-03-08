/* eslint-disable @typescript-eslint/no-unused-vars */

export default {
  namespace: 'cloudshell',
  state: {
    show: false,
  },
  reducers: {
    updateShow(state, { type, payload }) {
      return {
        ...state,
        show: payload,
      };
    },
  },
  effects: {
    *close(action, { call, put }) {
      yield put({ type: 'updateShow', payload: false });
    },
    *open(action, { call, put }) {
      yield put({ type: 'updateShow', payload: true });
    },
  },
};
