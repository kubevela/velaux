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
      const addonsList = getAddonsCardList(result || []);
      yield put({ type: 'updateAddonsList', payload: addonsList });
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
      status: item.status,
      icon: item.icon,
      description: item.description,
      createTime: item.createTime,
      btnContent: item.btnContent,
      href: href,
    };
    addonsCardContent.push(addons);
  }
  return addonsCardContent;
}
