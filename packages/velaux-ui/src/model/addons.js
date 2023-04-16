/* eslint-disable @typescript-eslint/no-unused-vars */
import {getAddonRegistriesList, getAddonsList, getEnabledAddons} from '../api/addons';

export default {
  namespace: 'addons',
  state: {
    addonsList: [],
    registryList: [],
    addonListMessage: '',
    enabledAddons: [],
  },
  reducers: {
    updateAddonsList(state, {type, payload}) {
      return {
        ...state,
        addonsList: payload.addons || [],
        addonListMessage: payload.message,
      };
    },
    updateAddonRegistriesList(state, {type, payload}) {
      return {
        ...state,
        registryList: payload || [],
      };
    },
    updateEnabledAddons(state, {type, payload}) {
      return {
        ...state,
        enabledAddons: payload.enabledAddons || [],
      };
    },
  },
  effects: {
    * getAddonsList(action, {call, put}) {
      const result = yield call(getAddonsList, action.payload);
      if (result) {
        yield put({type: 'updateAddonsList', payload: result});
        let uxPlugins = []
        for (const addon of result.addons) {
          if (addon.name === 'example') {
            addon.uxPlugins['node-dashboard'] = "https://kubevela-docs.oss-accelerate.aliyuncs.com/binary/example/node-dashboad.tar.gz"
          }
          if (addon.uxPlugins && Object.keys(addon.uxPlugins).length > 0) {
            for (const [key, value] of Object.entries(addon.uxPlugins)) {
              console.log(key, value)
              uxPlugins.push({id: key, url: value})
            }
          }
        }
        yield put({type: 'plugins/addBatchPluginToCache', payload: uxPlugins})
        if (action.callback) {
          action.callback(result);
        }
      }
    },
    * getEnabledAddons(action, {call, put}) {
      const result = yield call(getEnabledAddons, action.payload);
      if (result) {
        yield put({type: 'updateEnabledAddons', payload: result});
        if (action.callback) {
          action.callback(result);
        }
      }
    },
    * getAddonRegistriesList(action, {call, put}) {
      const result = yield call(getAddonRegistriesList, action.payload);
      const registries = result ? result.registries : [];
      yield put({type: 'updateAddonRegistriesList', payload: registries || []});
    },
  },
};
