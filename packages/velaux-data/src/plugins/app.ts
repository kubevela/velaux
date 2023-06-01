import { ComponentType } from 'react';
import { PluginMeta, VelaUXPlugin } from './types';
import { KeyValue } from '../types';

export interface AppPluginMeta<T extends KeyValue = KeyValue> extends PluginMeta<T> {
  // TODO anything specific to apps?
}

export interface AppRootProps<T extends KeyValue = KeyValue> {
  meta: AppPluginMeta<T>;
  /**
   * base URL segment for an app, /app/pluginId
   */
  basename: string; // The URL path to this page
}

export class AppPagePlugin<T extends KeyValue = KeyValue> extends VelaUXPlugin<AppPluginMeta<T>> {
  // Content under: /a/${plugin-id}/*
  root?: ComponentType<AppRootProps<T>>;

  /**
   * Called after the module has loaded, and before the app is used.
   * This function may be called multiple times on the same instance.
   * The first time, `this.meta` will be undefined
   */
  init(meta: AppPluginMeta) {}

  /**
   * Set the component displayed under:
   *   /a/${plugin-id}/*
   *
   * If the NavModel is configured, the page will have a managed frame, otheriwse it has full control.
   */
  setRootPage(root: ComponentType<AppRootProps<T>>) {
    this.root = root;
    return this;
  }
}
