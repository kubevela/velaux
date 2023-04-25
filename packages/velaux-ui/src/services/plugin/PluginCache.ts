import { PluginMeta } from '@velaux/data';
import { getBackendSrv } from '../BackendService';
import { managePlugin } from "../../api/productionLink";

const cache: Record<string, string> = {};
const initializedAt: number = Date.now();

type PluginCache = {
  [key: string]: PluginMeta;
};

type CacheablePlugin = {
  path: string;
  version: string;
};

const pluginInfoCache: PluginCache = {};

function formatPluginId(pluginId: string): string {
  return '$' + pluginId;
}

export function getPluginInfo(id: string): Promise<PluginMeta> {
  const pluginId = formatPluginId(id);
  const v = pluginInfoCache[pluginId];
  if (v) {
    return Promise.resolve(v);
  }
  return getBackendSrv()
    .get(`${managePlugin}/${id}`)
    .then((settings: any) => {
      pluginInfoCache[pluginId] = settings;
      return settings;
    })
    .catch((err: any) => {
      return Promise.reject(new Error('Unknown Plugin'));
    });
}

export const clearPluginSettingsCache = (id: string) => {
  const pluginId = formatPluginId(id);
  if (pluginId) {
    return delete pluginInfoCache[pluginId];
  }
  // clear all
  return Object.keys(pluginInfoCache).forEach((key) => delete pluginInfoCache[key]);
};

export function registerPluginInCache({ path, version }: CacheablePlugin): void {
  if (!cache[path]) {
    cache[path] = encodeURI(version);
  }
}

export function invalidatePluginInCache(pluginId: string): void {
  const path = `plugins/${pluginId}/module`;
  if (cache[path]) {
    delete cache[path];
  }
  clearPluginSettingsCache(pluginId);
}

export function locateWithCache(load: { address: string }, defaultBust = initializedAt): string {
  const { address } = load;
  const path = extractPath(address);

  if (!path) {
    return `${address}?_cache=${defaultBust}`;
  }

  const version = cache[path];
  const bust = version || defaultBust;
  return `${address}?_cache=${bust}`;
}

function extractPath(address: string): string | undefined {
  const match = /\/public\/(plugins\/.+\/module)\.js/i.exec(address);
  if (!match) {
    return;
  }
  const [_, path] = match;
  if (!path) {
    return;
  }
  return path;
}
