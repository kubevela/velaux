import { DefinitionPlugin } from '@velaux/data';
import * as React from 'react';
import { Translation } from '../../components/Translation';
import { getPluginSrv, importDefinitionPlugin } from '../../services/PluginService';

interface Props {
  pluginId: string;

  project?: string;

  // form props
  "data-meta"?: string;

  id: string;

  onChange: Function;

  value?: any;
}


function PluginRootFunction({ pluginId, ...rest }: Props, ref: React.ForwardedRef<any>) {
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
      <app.root meta={app.meta} {...rest} ref={ref}/>
    </div>
  );
}
export const PluginRoot = React.forwardRef(PluginRootFunction);

async function loadDefinitionPlugin(
  pluginId: string,
  setApp: React.Dispatch<React.SetStateAction<DefinitionPlugin | undefined>>
) {
  try {
    const pluginInfo = await getPluginSrv().loadMeta(pluginId);
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
