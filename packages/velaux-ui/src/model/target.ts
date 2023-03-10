import { getTarget } from '../api/target';

export interface QueryTarget {
  query?: string;
  page?: number;
  pageSize?: number;
  project?: string;
}

interface TargetState {
  targets: [];
  total: number;
}

interface ModelsType {
  namespace: string;
  state: TargetState;
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
    updateTargets(state: TargetState, { payload }: { payload: { targets: []; total: number } }) {
      return {
        ...state,
        targets: payload.targets,
        total: payload.total,
      };
    },
  },

  effects: {
    *listTargets(action: { payload: QueryTarget }, { call, put }: { call: any; put: any }) {
      const result: ResponseGenerator = yield call(getTarget, action.payload);
      yield put({ type: 'updateTargets', payload: result || {} });
    },
  },
};

export default targets;
