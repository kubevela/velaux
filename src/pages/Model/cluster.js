import {
  getClusterList,
  createCluster,
  getCloudClustersList,
  connectcloudCluster,
} from '../../api/cluster';

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
      const result = yield call(getClusterList, action.payload);
      yield put({ type: 'updateCLusterList', payload: result.clusters || [] });
    },
    *createCluster(action, { call, put }) {
      const { page, pageSize, query } = action.payload;
      const params = {
        query,
        page,
        pageSize,
      };
      const result = yield call(createCluster, action.payload);
      yield put({ type: 'getClusterList', payload: params });
    },
    *getCloudClustersList(action, { call, put }) {
      const result = yield call(getCloudClustersList, action.payload);
    },
    *connectcloudCluster(action, { call, put }) {
      const result = yield call(connectcloudCluster, action.payload);
    },
  },
};
