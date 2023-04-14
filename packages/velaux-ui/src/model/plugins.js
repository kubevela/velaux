import {disablePlugin, enablePlugin, getPluginList, installPlugin, uninstallPlugin} from "../api/plugin";

export default {
  namespace: 'plugins',
  state: {
    pluginList: [],
    enabledPlugins: [],
  },
  reducers: {
    updatePluginList(state, {type, payload}) {
      // update the enabledPlugins
      const enabledPlugins = payload.plugins.filter(plugin => plugin.enabled);
      return {
        ...state,
        pluginList: payload.plugins || [],
        enabledPlugins: enabledPlugins,
      };
    },
    addPluginToCache(state, {type, payload}) {
      // add the plugin to pluginList if not exist
      const pluginList = state.pluginList;
      const plugin = payload;
      if (!pluginList.find(p => p.id === plugin.id)) {
        pluginList.push(plugin);
      }
      return {
        ...state,
        pluginList: pluginList,
      }
    },
    removePluginFromCache(state, {type, payload}) {
      // remove the plugin from pluginList if exist
      const pluginList = state.pluginList;
      const plugin = payload;
      const index = pluginList.findIndex(p => p.id === plugin.id);
      if (index !== -1) {
        const removedPlugin = pluginList.splice(index, 1);
        console.log('remove', removedPlugin)
      }
      return {
        ...state,
        pluginList: pluginList,
      }
    },
    addPluginToEnableList(state, {type, payload}) {
      // add the plugin to enabledPlugins if not exist
      const enabledPlugins = state.enabledPlugins;
      const plugin = payload;
      if (!enabledPlugins.find(p => p.id === plugin.id)) {
        enabledPlugins.push(plugin);
      }
      return {
        ...state,
        enabledPlugins: enabledPlugins,
      }
    },
    removePluginFromEnableList(state, {type, payload}) {
      // remove the plugin from enabledPlugins if exist
      const enabledPlugins = state.enabledPlugins;
      const plugin = payload;
      const index = enabledPlugins.findIndex(p => p.id === plugin.id);
      if (index !== -1) {
        enabledPlugins.splice(index, 1);
      }
      return {
        ...state,
        enabledPlugins: enabledPlugins,
      }
    }
  },
  effects: {
    * installPlugin(action, {call, put}) {
      const res = yield call(installPlugin, action.payload);
      console.log(res)
      yield put({type: 'addPluginToCache', payload: res});
    },
    * uninstallPlugin(action, {call, put}) {
      const res = yield call(uninstallPlugin, action.payload);
      console.log(res)
      yield put({type: 'removePluginFromCache', payload: {id: action.payload.id}});

    },
    * getPluginList(action, {call, put}) {
      const res = yield call(getPluginList, action.payload);
      console.log("getPluginList", res)
      if (res) {
        yield put({type: 'updatePluginList', payload: res});
      }
    },
    * enablePlugin(action, {call, put}) {
      const res = yield call(enablePlugin, action.payload);
      if (res) {
        yield put({type: 'addPluginToEnableList', payload: res});
      }
    },
    * disablePlugin(action, {call, put}) {
      const res = yield call(disablePlugin, action.payload);
      if (res) {
        yield put({type: 'removePluginFromEnableList', payload: res});
      }
    }
  }
}
