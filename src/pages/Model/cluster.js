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
    cloudClusters: [],
    cloudClustersTotal: 0,
  },
  reducers: {
    updateCLusterList(state, { type, payload }) {
      return {
        ...state,
        clusterList: payload,
      };
    },
    updateCloudClusters(state, { type, payload }) {
      const { clusters = [], total = 0 } = payload;
      return {
        ...state,
        cloudClusters: clusters,
        cloudClustersTotal: total,
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
      console.log('result', result);
      yield put({ type: 'updateCloudClusters', payload: result });
    },
    *connectcloudCluster(action, { call, put }) {
      const { params, resolve } = action.payload;
      const result = yield call(connectcloudCluster, params);
      resolve(result);
    },
  },
};
