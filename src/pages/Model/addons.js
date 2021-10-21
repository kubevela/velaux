import { getAddonsList } from '../../api/addons';

export default {
  namespace: 'addons',
  state: {
    addonsList: [],
  },
  reducers: {
    updateAddonsList(state, { type, payload }) {
      return {
        ...state,
        addonsList: payload,
      };
    },
  },
  effects: {
    *getAddonsList(action, { call, put }) {
      const result = yield call(getAddonsList);
      const addonsList = getAddonsCardList(result || {});
      yield put({ type: 'updateAddonsList', payload: addonsList });
    },
  },
};

function getAddonsCardList(data) {
  return data;
}
