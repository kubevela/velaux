import { getConfigTypes } from '../api/integration';
import type { IntegrationBase } from '../interface/integrations';

const integrations: any = {
  namespace: 'integrations',
  state: {
    integrationsConfigTypes: [],
  },
  reducers: {
    updateIntegrationType(state: IntegrationBase, { payload }: { payload: IntegrationBase }) {
      return {
        ...state,
        integrationsConfigTypes: payload,
      };
    },
  },

  effects: {
    *getConfigTypes(
      action: { payload: { projectName: string } },
      { call, put }: { call: any; put: any },
    ) {
      const result: IntegrationBase[] = yield call(getConfigTypes, action.payload);
      yield put({ type: 'updateIntegrationType', payload: result || [] });
    },
  },
};

export default integrations;
