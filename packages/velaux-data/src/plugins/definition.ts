import { ComponentType } from 'react';
import { PluginMeta, VelaUXPlugin } from './types';
import { KeyValue } from '../types';

/**
 * The kinds of definition a definition plugin can replace the properties form of.
 */
export type DefinitionKind = 'component' | 'trait' | 'policy' | 'workflow-step' | 'source';

/**
 * One definition, by kind and name, as listed under `definitions` in plugin.json.
 */
export interface DefinitionRef {
  kind: DefinitionKind;
  name: string;
}

/**
 * Where the form is being filled in. Fields are absent where the dialog has no such scope.
 */
export interface DefinitionFormContext {
  project?: string;
  appName?: string;
}

/**
 * The props VelaUX passes to a definition plugin's form. The form owns `properties`:
 * it gets the current value and reports every change through onChange.
 */
export interface DefinitionFormProps<V = any> {
  value?: V;
  onChange: (value: V) => void;
  definition: DefinitionRef & { description?: string };
  context: DefinitionFormContext;
}

/**
 * Checks the properties before save. Returns a message to block saving, or nothing.
 */
export type DefinitionValidator<V = any> = (value: V | undefined) => string | undefined;

/**
 * A plugin that replaces the generated properties form for the definitions its
 * plugin.json lists. The module exports `plugin = new DefinitionPlugin().setForm(MyForm)`.
 */
export class DefinitionPlugin<T extends KeyValue = KeyValue> extends VelaUXPlugin<PluginMeta<T>> {
  form?: ComponentType<DefinitionFormProps>;
  validator?: DefinitionValidator;

  setForm(form: ComponentType<DefinitionFormProps>) {
    this.form = form;
    return this;
  }

  setValidator(validator: DefinitionValidator) {
    this.validator = validator;
    return this;
  }
}
