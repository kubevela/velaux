import { getTarget } from '../api/target';

export interface Querytarget {
  query?: string;
  page?: number;
  pageSize?: number;
  project?: string;
}

interface targetState {
  targets: [];
  total: number;
}

interface ModelsType {
  namespace: string;
  state: targetState;
  effects: {};
  reducers: {};
}

interface ResponseGenerator {
  config?: any;
  data?: any;
  headers?: any;
  request?: any;
  status?: number;
  error?: any;
  statusText?: string;
  records?: any;
  pageNum?: any;
  targetList?: any;
  targetListTotal?: any;
}

const targets: ModelsType = {
  namespace: 'target',
  state: {
    targets: [],
    total: 0,
  },
  reducers: {
    updateTargets(state: targetState, { payload }: { payload: { targets: []; total: number } }) {
      return {
        ...state,
        targets: payload.targets,
        total: payload.total,
      };
    },
  },

  effects: {
    *listTargets(action: { payload: Querytarget }, { call, put }: { call: any; put: any }) {
      const result: ResponseGenerator = yield call(getTarget, action.payload);
      yield put({ type: 'updateTargets', payload: result || {} });
    },
  },
};

export default targets;
