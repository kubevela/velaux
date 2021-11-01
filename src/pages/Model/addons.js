import { getAddonsList, getAddonRegistrysList } from '../../api/addons';
export default {
  namespace: 'addons',
  state: {
    addonsList: [],
    registryList: [],
  },
  reducers: {
    updateAddonsList(state, { type, payload }) {
      return {
        ...state,
        addonsList: payload,
      };
    },
    updateAddonRegistrysList(state, { type, payload }) {
      return {
        ...state,
        registryList: payload,
      };
    },
  },
  effects: {
    *getAddonsList(action, { call, put }) {
      const result = yield call(getAddonsList, action.payload);
      const addonsList = getAddonsCardList(result || []);
      yield put({ type: 'updateAddonsList', payload: addonsList });
    },
    *getAddonRegistrysList(action, { call, put }) {
      const result = yield call(getAddonRegistrysList, action.payload);
      yield put({ type: 'updateAddonRegistrysList', payload: result || [] });
    },
  },
};

function getAddonsCardList(data) {
  const addonsList = data.addons;
  if (addonsList === null) {
    return [];
  }
  const addonsCardContent = [];
  for (const item of addonsList) {
    const rules = item.gatewayRule && item.gatewayRule[0];
    const { protocol = '', address = '', componentPort = '' } = rules || {};
    const href = protocol + address + componentPort;
    const addons = {
      name: item.name,
      icon: item.icon,
      tags: item.tags,
      description: item.description,
      version: item.version,
    };
    addonsCardContent.push(addons);
  }
  return addonsCardContent;
}
