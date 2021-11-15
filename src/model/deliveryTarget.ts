import { getDeliveryTarget, createDeliveryTarget } from '../api/deliveryTarget';

const namespace = 'deliveryTarget';
export const namespace_clusters = namespace;

type State = {
  deliveryTagetList: [];
  deliveryTagetListTotal: number;
};

interface ModelsType {
  namespace: typeof namespace;
  state: State;
  effects: {};
  reducers: {};
}

export interface ResponseGenerator {
  config?: any;
  data?: any;
  headers?: any;
  request?: any;
  status?: number;
  error?: any;
  statusText?: string;
  records?: any;
  pageNum?: any;
  deliveryTagetList?: any;
  deliveryTagetListTotal?: any;
}

const DeliveryTargets: ModelsType = {
  namespace,
  state: {
    deliveryTagetList: [],
    deliveryTagetListTotal: 0,
  },
  reducers: {
    updateDeliveryTargets(
      state: State,
      { payload }: { payload: { deliveryTargets: {}; total: number } },
    ) {
      const { deliveryTargets = [], total = 0 } = payload;
      return {
        ...state,
        deliveryTargets,
        total,
      };
    },
  },

  effects: {
    *listDeliveryTarget(action: { payload: {} }, { call, put }: { call: any; put: any }) {
      const result: ResponseGenerator = yield call(getDeliveryTarget, action.payload);
      yield put({ type: 'updateDeliveryTargets', payload: result || {} });
    },
    *createDeliveryTarget(
      action: { payload: {}; callback: (parasm: any) => void },
      { call, put }: { call: any; put: any },
    ) {
      const result: ResponseGenerator = yield call(createDeliveryTarget, action.payload);
      if (action.callback) {
        action.callback(result);
      }
    },
  },
};

export default DeliveryTargets;
