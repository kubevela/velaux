import { getDeliveryTarget, createDeliveryTarget } from '../api/deliveryTarget';

export interface QueryDeliveryTarget {
  query?: string;
  page?: number;
  pageSize?: number;
  namespace?: string;
}

interface DeliveryTargetState {
  deliveryTargetList: [];
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

// type DeliveryTargetType = {
//   value: string;
//   label: string;
// }
// function getDeliveryTargetList(data: any) {
//   const deliveryTargets = data.deliveryTargets;
//   if (!deliveryTargets) {
//     return [];
//   }
//   const list = [];
//   for (const item of deliveryTargets) {
//     const deliveryTarget: DeliveryTargetType = {
//       value : item.name,
//       label : item.alias || item.name,
//     };
//     list.push(deliveryTarget);
//   }
//   return list;
// }

const DeliveryTargets: ModelsType = {
  namespace: 'deliveryTarget',
  state: {
    deliveryTargetList: [],
    deliveryTargetListTotal: 0,
  },
  reducers: {
    updateDeliveryTargets(
      state: DeliveryTargetState,
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
    *listDeliveryTarget(
      action: { payload: QueryDeliveryTarget },
      { call, put }: { call: any; put: any },
    ) {
      const result: ResponseGenerator = yield call(getDeliveryTarget, action.payload);
      // const deliveryTargetList = getDeliveryTargetList(result)
      yield put({ type: 'updateDeliveryTargets', payload: result || {} });
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
