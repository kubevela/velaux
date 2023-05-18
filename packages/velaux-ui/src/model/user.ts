import { getLoginUserInfo } from '../api/authentication';
import { loadSystemInfo } from '../api/system_config';
import type { SystemInfo , LoginUserInfo } from '@velaux/data';

const user: any = {
  namespace: 'user',
  state: {
    userInfo: {},
    systemInfo: {},
  },
  reducers: {
    updateUserInfo(state: any, { payload }: { payload: LoginUserInfo }) {
      return {
        ...state,
        userInfo: payload,
      };
    },
    updateSystemInfo(state: any, { payload }: { payload: SystemInfo }) {
      return {
        ...state,
        systemInfo: payload,
      };
    },
  },

  effects: {
    *getLoginUserInfo(
      action: { payload: Record<string, never>; callback: (data: LoginUserInfo) => void },
      { call, put }: { call: any; put: any },
    ) {
      const result: LoginUserInfo = yield call(getLoginUserInfo, action.payload);
      yield put({ type: 'updateUserInfo', payload: result || {} });
      if (action.callback && result) {
        action.callback(result);
      }
    },
    *getSystemInfo(
      action: { payload: Record<string, never>; callback: (data: SystemInfo) => void },
      { call, put }: { call: any; put: any },
    ) {
      const result: SystemInfo = yield call(loadSystemInfo, action.payload);
      yield put({ type: 'updateSystemInfo', payload: result || {} });
      if (result && action.callback) {
        action.callback(result);
      }
    },
  },
};

export default user;
