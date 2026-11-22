import type { ApplyDefKitPreviewRequest, DefKitSettings, DefKitSource } from '@velaux/data';
import { getDomain } from '../utils/common';
import { defkit } from './productionLink';
import { get, post, put, rdelete } from './request';

const base = getDomain().APIBASE + defkit;

// listDefKitModules lists the modules; with customError a failure rejects with the server's error instead of a toast.
export function listDefKitModules(customError?: boolean) {
  return get(base, { customError }).then((res) => res);
}

// listDefKitRepositories are the module sources the defkit addon offers.
export function listDefKitRepositories() {
  return get(`${base}/repositories`, {}).then((res) => res);
}

export function detailDefKitModule(name: string, customError?: boolean) {
  return get(`${base}/${name}`, { customError }).then((res) => res);
}

export function createDefKitModule(name: string, source: DefKitSource, settings: DefKitSettings) {
  return post(base, { name, ...source, ...settings }).then((res) => res);
}

export function updateDefKitModule(name: string, source: DefKitSource, settings: DefKitSettings) {
  return put(`${base}/${name}`, { ...source, ...settings }).then((res) => res);
}

export function deleteDefKitModule(name: string) {
  return rdelete(`${base}/${name}`, {}).then((res) => res);
}

export function previewDefKitModule(name: string, customError?: boolean) {
  return get(`${base}/${name}/preview`, { customError }).then((res) => res);
}

// applyDefKitPreview applies the render reviewed; it rejects with the server's
// error so that a render changed since the review can be told apart.
export function applyDefKitPreview(name: string, req: ApplyDefKitPreviewRequest) {
  return post(`${base}/${name}/apply`, req, true).then((res) => res);
}
