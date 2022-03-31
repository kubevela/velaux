import { getLoginUserInfo } from '../api/authentication';
import { loadSystemInfo } from '../api/config';
import type { SystemInfo } from '../interface/system';
import type { LoginUserInfo } from '../interface/user';

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
      action: { payload: { projectName: string } },
      { call, put }: { call: any; put: any },
    ) {
      const result: LoginUserInfo = yield call(getLoginUserInfo, action.payload);
      yield put({ type: 'updateUserInfo', payload: result || {} });
    },
    *getSystemInfo(
      action: { payload: { projectName: string } },
      { call, put }: { call: any; put: any },
    ) {
      const result: SystemInfo = yield call(loadSystemInfo, action.payload);
      yield put({ type: 'updateSystemInfo', payload: result || {} });
    },
  },
};

export default user;
