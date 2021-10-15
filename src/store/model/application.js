import { getApplicationList } from '../../api/application';
import { getAppCardList } from "../../utils/common";

export default {
  namespace: 'application',
  state: {
    applicationList: [],
    projectList: [],
    clusterList: [],
    searchAppName: ''
  },
  reducers: {
    update(state, { type, payload }) {
      return {
        ...state,
        searchAppName: payload
      }
    },
    updateApplicationList(state, { type, payload }) {

      return {
        ...state,
        applicationList: payload
      }
    }
  },
  effects: {
    * getApplicationList(action, { call, put }) {
      const result = yield call(getApplicationList);
      const appContent = getAppCardList(result.data);
      yield put({ type: 'updateApplicationList', payload: appContent })
    }
  }
}
