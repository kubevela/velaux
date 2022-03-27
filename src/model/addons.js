/* eslint-disable @typescript-eslint/no-unused-vars */
import { getAddonsList, getAddonRegistriesList } from '../api/addons';
export default {
  namespace: 'addons',
  state: {
    addonsList: [],
    registryList: [],
    addonListMessage: '',
  },
  reducers: {
    updateAddonsList(state, { type, payload }) {
      return {
        ...state,
        addonsList: payload.addons || [],
        addonListMessage: payload.message,
      };
    },
    updateAddonRegistriesList(state, { type, payload }) {
      return {
        ...state,
        registryList: payload || [],
      };
    },
  },
  effects: {
    *getAddonsList(action, { call, put }) {
      const result = yield call(getAddonsList, action.payload);
      if (result) {
        yield put({ type: 'updateAddonsList', payload: result });
        if (action.callback) {
          action.callback(result);
        }
      }
    },
    *getAddonRegistriesList(action, { call, put }) {
      const result = yield call(getAddonRegistriesList, action.payload);
      const registries = result ? result.registries : [];
      yield put({ type: 'updateAddonRegistriesList', payload: registries || [] });
    },
  },
};
