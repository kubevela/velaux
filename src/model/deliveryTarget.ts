import { getDeliveryTarget, createDeliveryTarget } from '../api/target';

export interface QueryDeliveryTarget {
  query?: string;
  page?: number;
  pageSize?: number;
  project?: string;
}

interface DeliveryTargetState {
  deliveryTargetList: [];
  deliveryTargets: [];
  deliveryTargetListTotal: number;
}

interface ModelsType {
  namespace: string;
  state: DeliveryTargetState;
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
  deliveryTargetList?: any;
  deliveryTargetListTotal?: any;
}

function getDeliveryTargetList(data: any) {
  const deliveryTargets = data.deliveryTargets;
  if (!deliveryTargets) {
    return [];
  }
  const list = [];
  for (const item of deliveryTargets) {
    const deliveryTarget = {
      value: item.name,
      label: item.alias || item.name,
    };
    list.push(deliveryTarget);
  }
  return list;
}

const DeliveryTargets: ModelsType = {
  namespace: 'deliveryTarget',
  state: {
    deliveryTargetList: [],
    deliveryTargets: [],
    deliveryTargetListTotal: 0,
  },
  reducers: {
    updateDeliveryTargets(
      state: DeliveryTargetState,
      { payload }: { payload: { targets: {}; total: number } },
    ) {
      const { targets = [], total = 0 } = payload;
      return {
        ...state,
        deliveryTargets: targets,
        total,
      };
    },

    updateDeliveryTargetList(state: any, { payload }: { payload: { deliveryTargetList: [] } }) {
      return {
        ...state,
        deliveryTargets: payload,
      };
    },
  },

  effects: {
    *listDeliveryTarget(
      action: { payload: QueryDeliveryTarget },
      { call, put }: { call: any; put: any },
    ) {
      const result: ResponseGenerator = yield call(getDeliveryTarget, action.payload);
      yield put({ type: 'updateDeliveryTargets', payload: result || {} });
    },

    *listTargets(action: any, { call, put }: { call: any; put: any }) {
      const result: ResponseGenerator = yield call(getDeliveryTarget, action.payload);
      const deliveryTargetList = getDeliveryTargetList(result);
      yield put({ type: 'updateDeliveryTargetList', payload: deliveryTargetList || [] });
    },

    *createDeliveryTarget(
      action: { payload: QueryDeliveryTarget; callback: (parasm: any) => void },
      { call }: { call: any; put: any },
    ) {
      const result: ResponseGenerator = yield call(createDeliveryTarget, action.payload);
      if (action.callback) {
        action.callback(result);
      }
    },
  },
};

export default DeliveryTargets;
