import { listTemplates } from '../api/config';
import type { ConfigTemplate, ListTemplateResponse } from '@velaux/data';

interface ConfigState {
  configTemplates: ConfigTemplate[];
}

const configs: any = {
  namespace: 'configs',
  state: {
    configTemplates: [],
  },
  reducers: {
    updateTemplates(state: ConfigState, { payload }: { payload: ListTemplateResponse }) {
      return {
        ...state,
        configTemplates: payload.templates || [],
      };
    },
  },

  effects: {
    *loadTemplates(action: { payload: {} }, { call, put }: { call: any; put: any }) {
      const result: ListTemplateResponse = yield call(listTemplates);
      if (result) {
        yield put({ type: 'updateTemplates', payload: result });
      }
    },
  },
};

export default configs;
