import { getDeliveryTarget, createDeliveryTarget } from '../api/deliveryTarget';
import {
  ModelsType,
  ResponseGenerator,
  DeliveryTargetState,
  QueryDeliveryTarget,
} from '../interface/deliveryTarget';

const DeliveryTargets: ModelsType = {
  namespace: 'deliveryTarget',
  state: {
    deliveryTagetList: [],
    deliveryTagetListTotal: 0,
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
      yield put({ type: 'updateDeliveryTargets', payload: result || {} });
    },
    *createDeliveryTarget(
      action: { payload: QueryDeliveryTarget; callback: (parasm: any) => void },
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
