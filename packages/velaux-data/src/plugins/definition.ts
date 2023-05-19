import { ComponentType } from 'react';
import { PluginMeta, VelaUXPlugin } from '.';
import { KeyValue } from '../types/data';


export interface DefinitionPluginMeta<T extends KeyValue = KeyValue> extends PluginMeta<T> {
  // TODO anything specific to definition?
}

export interface DefinitionRootProps<T extends KeyValue = KeyValue> {
  meta: DefinitionPluginMeta<T>;
 
  pluginId: string;

  project?: string;

  // form props
  "data-meta": string;

  id: string;

  onChange: Function;

  value: any;

  ref: any;
}

export class DefinitionPlugin<T extends KeyValue = KeyValue> extends VelaUXPlugin<DefinitionPluginMeta<T>> {
  // Content under: /a/${plugin-id}/*
  root?: ComponentType<DefinitionRootProps<T>>;

  /**
   * Called after the module has loaded, and before the definition is used.
   * This function may be called multiple times on the same instance.
   * The first time, `this.meta` will be undefined
   */
  init(meta: DefinitionPluginMeta) {}

  /**
   * Set the component displayed under:
   *   /a/${plugin-id}/*
   *
   * If the NavModel is configured, the page will have a managed frame, otheriwse it has full control.
   */
  setRootPage(root: ComponentType<DefinitionRootProps<T>>) {
    this.root = root;
    return this;
  }
}
