import { getEnvs } from '../api/env';
import type { Env, EnvListResponse } from '@velaux/data';

export interface Query {
  query?: string;
  page?: number;
  pageSize?: number;
  project?: string;
}

interface EnvState {
  envs: Env[];
  envTotal: number;
}

const envs: any = {
  namespace: 'env',
  state: {
    envs: [],
    envTotal: 0,
  },
  reducers: {
    updateEnvs(state: EnvState, { payload }: { payload: EnvListResponse }) {
      return {
        ...state,
        envs: payload.envs,
        envTotal: payload.total || 0,
      };
    },
  },

  effects: {
    *listEnvs(action: { payload: Query }, { call, put }: { call: any; put: any }) {
      const result: EnvListResponse = yield call(getEnvs, action.payload);
      yield put({ type: 'updateEnvs', payload: result || {} });
    },
  },
};

export default envs;
