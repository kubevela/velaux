import { AppPagePlugin } from '@velaux/data';
import * as React from 'react';
import Translation from '../../components/Translation';
import { locationService } from '../../services/LocationService';
import { getPluginSrv, importAppPagePlugin } from '../../services/PluginService';

interface Props {
  pluginId: string;
}
export function AppRootPage({ pluginId }: Props) {
  const [app, setApp] = React.useState<AppPagePlugin>();
  React.useEffect(() => {
    loadAppPlugin(pluginId, setApp);
  }, [pluginId]);
  if (!app || !app.root) {
    return (
      <div>
        <Translation>No root app page component found</Translation>
      </div>
    );
  }
  const pluginRoot = app && app.root && <app.root meta={app.meta} basename={locationService.getLocation().pathname} />;

  return <div>{pluginRoot}</div>;
}

async function loadAppPlugin(
  pluginId: string,
  setApp: React.Dispatch<React.SetStateAction<AppPagePlugin | undefined>>
) {
  try {
    const app = await getPluginSrv().loadPlugin(pluginId);
    if (app) {
      importAppPagePlugin(app)
        .then((pageApp) => {
          setApp(pageApp);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } catch (err) {}
}
