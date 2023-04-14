import * as React from 'react';
import { Button } from '@velaux/ui';
import { PluginConfigPageProps, AppPluginMeta, PluginMeta } from '@velaux/data';
import { enablePlugin } from "@velaux/ui";
import { PluginEnableRequest } from "@velaux/data";

export type AppPluginSettings = {};

export interface AppConfigProps extends PluginConfigPageProps<AppPluginMeta<AppPluginSettings>> {}

export const AppConfig = ({ plugin }: AppConfigProps) => {
  const { enabled, jsonData } = plugin.meta;

  return (
    <div className="gf-form-group">
      <div>
        {/* Enable the plugin */}
        <div>Enable / Disable</div>
        {!enabled && (
          <>
            <div>The plugin is currently not enabled.</div>
            <Button
              type="primary"
              onClick={() =>
                updatePluginAndReload(plugin.meta.id, {
                  enabled: true,
                  jsonData,
                })
              }
            >
              Enable plugin
            </Button>
          </>
        )}

        {/* Disable the plugin */}
        {enabled && (
          <>
            <div>The plugin is currently enabled.</div>
            <Button
              type="secondary"
              onClick={() =>
                updatePluginAndReload(plugin.meta.id, {
                  enabled: false,
                  jsonData,
                })
              }
            >
              Disable plugin
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

const updatePluginAndReload = async (pluginId: string, data: Partial<PluginMeta>) => {
  try {
    const params: PluginEnableRequest = {
      id: pluginId,
      jsonData: data.jsonData? data.jsonData : {},
      secureJsonData: data.secureJsonData? data.secureJsonData : {},
    }
    await enablePlugin(params).then((res) => {
      console.log(res);
    }).catch((err) => {
      console.log(err);
    })
    //await updatePlugin(pluginId, data);

    // Reloading the page as the changes made here wouldn't be propagated to the actual plugin otherwise.
    // This is not ideal, however unfortunately currently there is no supported way for updating the plugin state.
    window.location.reload();
  } catch (e) {
    console.error('Error while updating the plugin', e);
  }
};

// export const updatePlugin = async (pluginId: string, data: Partial<PluginMeta>) => {
//   const response = getBackendSrv().fetch({
//     url: `/api/plugins/${pluginId}/settings`,
//     method: 'POST',
//     data,
//   });
//   return lastValueFrom(response);
// };
