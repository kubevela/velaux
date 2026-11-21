// This module was inspired by Grafana.

// @ts-ignore
import System from 'systemjs/dist/system.js';

import _ from 'lodash'; // eslint-disable-line lodash/import-scope
import moment from 'moment'; // eslint-disable-line no-restricted-imports
import react from 'react';
import * as velauxData from '@velaux/data'; // eslint-disable-line no-restricted-imports
import { AppPagePlugin, DefinitionPlugin, PluginLink, PluginMeta, PluginType } from '@velaux/data';
import type { DefinitionKind } from '@velaux/data';
import * as velauxUI from '../types'; // eslint-disable-line no-restricted-imports
import * as ReactDom from 'react-dom';
import * as DvaRouter from 'dva/router';
import * as Redux from 'redux';
import builtInPlugins from './plugin/BuiltInPlugins';
import { getPluginInfo, locateWithCache, registerPluginInCache } from './plugin/PluginCache';
import { getBackendSrv } from './BackendService';
import { createDefinitionPluginFinder } from '../utils/definitionPlugin';
import type { DefinitionPluginLookup } from '../utils/definitionPlugin';

/**
 * @internal
 */
export const SystemJS = System;

SystemJS.registry.set('plugin-loader', SystemJS.newModule({ locate: locateWithCache }));

SystemJS.config({
  baseURL: '/public',
  defaultExtension: 'js',
  packages: {
    plugins: {
      defaultExtension: 'js',
    },
  },
  meta: {
    '/*': {
      esModule: true,
      authorization: false,
      loader: 'plugin-loader',
    },
  },
});

export function exposeToPlugin(name: string, component: any) {
  SystemJS.registerDynamic(name, [], true, (require: any, exports: any, module: { exports: any }) => {
    module.exports = component;
  });
}

exposeToPlugin('lodash', _);
exposeToPlugin('moment', moment);
exposeToPlugin('@velaux/data', velauxData);
exposeToPlugin('@velaux/ui', velauxUI);
exposeToPlugin('react', react);
exposeToPlugin('react-dom', ReactDom);
exposeToPlugin('redux', Redux);
exposeToPlugin('dva/router', DvaRouter);

export async function importPluginModule(path: string, version?: string): Promise<any> {
  if (version) {
    registerPluginInCache({ path, version });
  }
  const builtIn = builtInPlugins[path];
  if (builtIn) {
    // for handling dynamic imports
    if (typeof builtIn === 'function') {
      return await builtIn();
    } else {
      return builtIn;
    }
  }
  return SystemJS.import(path);
}

export function importAppPagePlugin(meta: PluginMeta): Promise<AppPagePlugin> {
  return importPluginModule(meta.module, meta.info?.version).then((pluginExports) => {
    const plugin = pluginExports.plugin ? (pluginExports.plugin as AppPagePlugin) : new AppPagePlugin();
    plugin.init(meta);
    plugin.meta = meta;
    return plugin;
  });
}

export function importDefinitionPlugin(meta: PluginMeta): Promise<DefinitionPlugin> {
  return importPluginModule(meta.module, meta.info?.version).then((pluginExports) => {
    const plugin = pluginExports.plugin ? (pluginExports.plugin as DefinitionPlugin) : new DefinitionPlugin();
    plugin.meta = meta;
    return plugin;
  });
}

/**
 * @public
 * A wrapper to generate the menu configs
 */
export interface PluginService {
  listAppPagePlugins(): Promise<PluginMeta[]>;

  listDefinitionPlugins(): Promise<PluginMeta[]>;

  // findDefinitionPlugin loads the plugin that replaces the properties form of
  // the definition, if one is enabled.
  findDefinitionPlugin(kind: DefinitionKind, name: string): Promise<DefinitionPluginLookup>;

  loadMeta(pluginID: string): Promise<PluginMeta | PluginLink>;
}

/** @internal */
export class PluginWrapper implements PluginService {
  constructor() {
  }

  listAppPagePlugins(): Promise<PluginMeta[]> {
    return getBackendSrv()
      .get('/api/v1/plugins')
      .then((res: any) => {
        if (res) {
          const plugins = res.plugins ? (res.plugins as PluginMeta[]) : [];
          return Promise.resolve(plugins.filter((p) => p.type === PluginType.PageApp));
        }
        return Promise.reject(new Error('Unknown Plugins'));
      });
  }

  listDefinitionPlugins(): Promise<PluginMeta[]> {
    return getBackendSrv()
      .get('/api/v1/plugins')
      .then((res: any) => {
        const plugins = res && res.plugins ? (res.plugins as PluginMeta[]) : [];
        return plugins.filter((p) => p.type === PluginType.Definition);
      });
  }

  findDefinitionPlugin = createDefinitionPluginFinder(
    () => this.listDefinitionPlugins(),
    (meta) => importDefinitionPlugin(meta)
  );

  async loadMeta(pluginID: string): Promise<PluginMeta> {
    return getPluginInfo(pluginID);
  }
}

/**
 * @private
 */
let
  pluginService: PluginService = new PluginWrapper();

export const
  getPluginSrv = (): PluginService => pluginService;
