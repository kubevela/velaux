import { getClusterList } from '../../api/cluster';

export default {
  namespace: 'clusters',
  state: {
    clusterList: [],
  },
  reducers: {
    updateCLusterList(state, { type, payload }) {
      return {
        ...state,
        clusterList: payload,
      };
    },
  },
  effects: {
    *getClusterList(action, { call, put }) {
      const result = yield call(getClusterList);
      yield put({ type: 'updateCLusterList', payload: result });
    },
  },
};
