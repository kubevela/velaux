import * as React from 'react';
import { PluginConfigPageProps, AppPluginMeta } from '@velaux/data';

export type AppPluginSettings = {};

export interface AppConfigProps extends PluginConfigPageProps<AppPluginMeta<AppPluginSettings>> {}

// AppConfig is the plugin's settings form; VelaUX's config page owns enabling and disabling it.
export const AppConfig = (_: AppConfigProps) => {
  return <div className="gf-form-group">This plugin has no settings to configure.</div>;
};
