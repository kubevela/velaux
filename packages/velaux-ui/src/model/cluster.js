/* eslint-disable @typescript-eslint/no-unused-vars */
import { getClusterList, createCluster, connectcloudCluster } from '../api/cluster';

export default {
  namespace: 'clusters',
  state: {
    clusterList: [],
    cloudClusters: [],
    cloudClustersTotal: 0,
  },
  reducers: {
    updateClusterList(state, { type, payload }) {
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
      if (result) {
        yield put({ type: 'updateClusterList', payload: result.clusters || [] });
      }
    },
    *createCluster(action, { call, put }) {
      const result = yield call(createCluster, action.payload);
      if (action.callback) {
        action.callback(result);
      }
    },
    *connectcloudCluster(action, { call, put }) {
      const { params, resolve } = action.payload;
      const result = yield call(connectcloudCluster, params);
      resolve(result);
    },
  },
};
