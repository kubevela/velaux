import {
  detailPlugin,
  disablePlugin,
  enablePlugin,
  getPluginList,
  installPlugin,
  setPlugin,
  uninstallPlugin
} from "../api/plugin";

export default {
  namespace: 'plugins',
  state: {
    pluginList: [],
  },
  reducers: {
    addOrUpdatePlugin(state, {type, payload}) {
      // add the plugin to pluginList if not exist
      const pluginList = state.pluginList;
      const plugin = payload;
      const newPluginList = pluginList.map((p) => {
        if (p.id === plugin.id) {
          return plugin;
        } else {
          return p;
        }
      })
      return {
        ...state,
        pluginList: newPluginList,
      }
    },
    addOrUpdateBatchPlugins(state, {type, payload}) {
      // add the plugin to pluginList if not exist
      const pluginList = state.pluginList;
      // make a copy to newPluginList
      const newPluginList = pluginList.slice();
      // merge payload to newPluginList
      for (const plugin of payload) {
        let idx = newPluginList.findIndex(p => p.id === plugin.id)
        if (idx === -1) {
          newPluginList.push(plugin);
        } else {
          const _old = newPluginList[idx]
          const _new = {..._old, ...plugin}
          newPluginList[idx] = _new
        }
      }
      return {
        ...state,
        pluginList: newPluginList,
      }
    },
    removePluginDetail(state, {type, payload}) {
      // remove the plugin from pluginList if exist
      const pluginList = state.pluginList;
      const {id} = payload;
      const newPluginList = pluginList.map((p) => {
        if (p.id === id) {
          return {
            id: p.id,
            url: p.url,
          }
        } else {
          return p;
        }
      })
      return {
        ...state,
        pluginList: newPluginList,
      }
    },
  },
  effects: {
    * installPlugin(action, {call, put}) {
      try {
        const res = yield call(installPlugin, action.payload);
        if (res && res.info) {
          // There's no url in returned plugin object, so we need to set it after calling
          res.url = action.payload.url
          yield put({type: 'addOrUpdatePlugin', payload: res});
          if (action.callback) {
            action.callback();
          }
        }
      } catch (e) {
        console.log('Error in installPlugin:', e)
      }
    },
    * uninstallPlugin(action, {call, put}) {
      yield call(uninstallPlugin, action.payload);
      yield put({type: 'removePluginDetail', payload: action.payload})
      if (action.callback) {
        action.callback();
      }
    },
    * getPluginList(action, {call, put}) {
      const res = yield call(getPluginList, action.payload);
      if (res) {
        yield put({type: 'addOrUpdateBatchPlugins', payload: res.plugins});
      }
    },
    * detailPlugin(action, {call, put}) {
      const res = yield call(detailPlugin, action.payload);
      if (res) {
        yield put({type: 'addOrUpdatePlugin', payload: res});
      }
    },
    * enablePlugin(action, {call, put}) {
      const res = yield call(enablePlugin, action.payload);
      if (res.info) {
        yield put({type: 'addOrUpdatePlugin', payload: res});
      }
      if (action.callback) {
        action.callback();
      }
    },
    * setPlugin(action, {call, put}) {
      const res = yield call(setPlugin, action.payload);
      if (res) {
        yield put({type: 'addOrUpdatePlugin', payload: res});
      }
      if (action.callback) {
        action.callback();
      }
    },
    * disablePlugin(action, {call, put}) {
      const res = yield call(disablePlugin, action.payload);
      if (res) {
        yield put({type: 'addOrUpdatePlugin', payload: res});
      }
      if (action.callback) {
        action.callback();
      }
    }
  }
}
