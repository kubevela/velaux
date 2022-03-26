import { getLoginUserInfo } from '../api/authentication';
import type { LoginUserInfo } from '../interface/user';

const user: any = {
  namespace: 'user',
  state: {
    userInfo: {},
  },
  reducers: {
    updateUserInfo(state: LoginUserInfo, { payload }: { payload: LoginUserInfo }) {
      return {
        ...state,
        userInfo: payload,
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
  },
};

export default user;
