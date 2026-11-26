import type { DefinitionFormProps, DefinitionKind, DefinitionValidator, PluginMeta } from '@velaux/data';
import type { ComponentType } from 'react';

/**
 * The part of a loaded definition plugin the properties form uses.
 */
export interface LoadedDefinitionPlugin {
  meta: PluginMeta;
  form?: ComponentType<DefinitionFormProps>;
  validator?: DefinitionValidator;
}

export type DefinitionPluginLookup =
  | { status: 'none' }
  | { status: 'loaded'; plugin: LoadedDefinitionPlugin }
  | { status: 'failed'; pluginID: string; error: string };

// definitionKind maps the definition type the forms pass to UISchema onto a
// plugin definition kind; the workflow studio spells its type workflowstep.
export function definitionKind(type?: string): DefinitionKind | undefined {
  switch (type) {
    case 'component':
    case 'trait':
    case 'policy':
    case 'source':
    case 'workflow-step':
      return type;
    case 'workflowstep':
      return 'workflow-step';
  }
  return undefined;
}

// matchDefinitionPlugin returns the first enabled definition plugin that lists
// the definition.
export function matchDefinitionPlugin(
  plugins: PluginMeta[],
  kind: DefinitionKind,
  name: string
): PluginMeta | undefined {
  return plugins.find(
    (p) =>
      p.type === 'definition' &&
      p.enabled !== false &&
      (p.definitions || []).some((d) => d.kind === kind && d.name === name)
  );
}

// createDefinitionPluginFinder caches the plugin list and each plugin's module
// for the session. A failed list is not cached, so the next form asks again.
export function createDefinitionPluginFinder(
  list: () => Promise<PluginMeta[]>,
  load: (meta: PluginMeta) => Promise<LoadedDefinitionPlugin>
): (kind: DefinitionKind, name: string) => Promise<DefinitionPluginLookup> {
  let plugins: Promise<PluginMeta[]> | undefined;
  const modules: Record<string, Promise<LoadedDefinitionPlugin>> = {};
  return async (kind, name) => {
    if (!plugins) {
      plugins = list();
    }
    let all: PluginMeta[];
    try {
      all = await plugins;
    } catch (e) {
      plugins = undefined;
      return { status: 'none' };
    }
    const meta = matchDefinitionPlugin(all, kind, name);
    if (!meta) {
      return { status: 'none' };
    }
    if (!modules[meta.id]) {
      modules[meta.id] = load(meta);
    }
    try {
      const plugin = await modules[meta.id];
      if (!plugin.form) {
        return { status: 'failed', pluginID: meta.id, error: 'the plugin module sets no form' };
      }
      return { status: 'loaded', plugin };
    } catch (e) {
      return { status: 'failed', pluginID: meta.id, error: e instanceof Error ? e.message : String(e) };
    }
  };
}

// pluginValidation runs the validator of a loaded plugin. The coding mode, and
// any definition without a loaded plugin, are validated by the generated form.
export function pluginValidation(
  lookup: DefinitionPluginLookup | undefined,
  codeMode: boolean,
  value: any
): { applies: false } | { applies: true; error?: string } {
  if (codeMode || lookup?.status !== 'loaded') {
    return { applies: false };
  }
  return { applies: true, error: lookup.plugin.validator ? lookup.plugin.validator(value) : undefined };
}

// PropertiesValidator is the part of the properties form a dialog validates
// through: it reports the plugin's own message, or the generic one it is given.
export interface PropertiesValidator {
  validate(callback: (error?: string) => void, generic?: string): void;
}

// propertiesRule is the Field rule for a dialog's properties. It sets no rule
// message, since Field would show that in place of the plugin's own.
export function propertiesRule(form: () => PropertiesValidator | null | undefined, generic: string) {
  return {
    validator: (_rule: any, _value: any, callback: (error?: string) => void) => {
      const current = form();
      if (!current) {
        callback();
        return;
      }
      current.validate(callback, generic);
    },
  };
}
