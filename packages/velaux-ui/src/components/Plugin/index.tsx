import { DefinitionPlugin, DefinitionRootProps } from '@velaux/data';
import * as React from 'react';
import { Translation } from '../../components/Translation';
import { getPluginSrv, importDefinitionPlugin } from '../../services/PluginService';


function PluginRootFunction({ pluginId, ...rest }: DefinitionRootProps, ref) {
  const [app, setApp] = React.useState<DefinitionPlugin>();
  React.useEffect(() => {
    loadDefinitionPlugin(pluginId, setApp);
  }, [pluginId]);
  if (!app || !app.root) {
    return (
      <div>
        <Translation>No root plugin component found</Translation>
      </div>
    );
  }

  return (
    <div>
      <app.root meta={app.meta} {...rest} ref={ref} />
    </div>
  );
}
export const PluginRoot = React.forwardRef(PluginRootFunction);

async function loadDefinitionPlugin(
  pluginId: string,
  setApp: React.Dispatch<React.SetStateAction<DefinitionPlugin | undefined>>
) {
  try {
    const pluginInfo = await getPluginSrv().loadPlugin(pluginId);
    if (pluginInfo) {
      importDefinitionPlugin(pluginInfo)
        .then((definitionPlugin) => {
          setApp(definitionPlugin);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } catch (err) { }
}
