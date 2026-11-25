import { AppPagePlugin, PluginMeta } from '@velaux/data';
import * as React from 'react';
import i18n from 'i18next';
import { Translation } from '../../components';
import { Breadcrumb } from '../../components/Breadcrumb';
import { StatusBadge } from '../../components/StatusBadge';
import { locationService } from '../../services';
import { getPluginSrv, importAppPagePlugin } from '../../services/PluginService';
import { Button, Loading, Message } from '@alifd/next';
import { AiOutlineAppstore, AiOutlineSetting } from 'react-icons/ai';
import './index.less';
import { connect } from 'dva';

interface Props {
  pluginId: string;
  dispatch: any;
  pluginList: PluginMeta[];
  loading: any;
}

function RootPage({ pluginId }: Props) {
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

  const AppRootPage = app.root;
  return (
    <div>
      <AppRootPage meta={app.meta} basename={locationService.getLocation().pathname} />
    </div>
  );
}

// PluginLogo is the plugin's logo, or a plain icon when it has none or it fails to load.
function PluginLogo({ src }: { src?: string }) {
  const [failed, setFailed] = React.useState(false);
  const url = src && src !== 'null' ? (src.startsWith('/') ? src : '/' + src) : '';
  return (
    <span className="plugin-logo">
      {url && !failed ? <img src={url} alt="" onError={() => setFailed(true)} /> : <AiOutlineAppstore />}
    </span>
  );
}

enum types {
  UPDATE_META,
}

function ConfigPage({ pluginId, dispatch, pluginList, loading }: Props) {
  const [app, setApp] = React.useState<AppPagePlugin>();
  const _meta = pluginList.filter((item) => item.id === pluginId)[0];
  const updateMeta = (previousState: any, action: any) => {
    if (action.type == types.UPDATE_META) {
      return { ...previousState, ...action.payload };
    }
    throw new Error('Unknown action type');
  };
  const [meta, dispatchMeta] = React.useReducer(updateMeta, _meta);

  const handleJSONChange = (key: string, value: any) => {
    const newJsonData = { ...meta.jsonSetting };
    newJsonData[key] = value;
    meta.jsonSetting = newJsonData;
    setApp({ ...app, meta: meta } as AppPagePlugin);
  };
  const handleSecureJSONChange = (key: string, value: any) => {
    const newSecureJsonData = { ...meta.secureJsonData };
    newSecureJsonData[key] = value;
    meta.secureJsonData = newSecureJsonData;
    setApp({ ...app, meta: meta } as AppPagePlugin);
  };

  // Get PluginMeta
  React.useEffect(() => {
    if (!meta) {
      getPluginSrv()
        .loadMeta(pluginId)
        .then((m) => {
          dispatchMeta({
            type: types.UPDATE_META,
            payload: m,
          });
        });
    }
  }, [meta, pluginId]);

  // Get whole plugin by PluginMeta
  React.useEffect(() => {
    if (!meta) {
      return;
    }
    importAppPagePlugin(meta)
      .then((pageApp) => {
        setApp(pageApp);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [meta]);

  if (!meta || !app || !app.configPages || !app.configPages.body) {
    return (
      <div>
        <Translation>No config app page component found</Translation>
      </div>
    );
  }

  const isEnabled = meta.enabled;
  const isInstalled = !!meta.info;

  const saveSetting = () => {
    dispatch({
      type: 'plugins/setPlugin',
      payload: {
        id: pluginId,
        jsonData: meta.jsonSetting,
        secureJsonData: meta.secureJsonData,
      },
      callback: () => {
        Message.success('Setting saved');
      },
    });
  };

  const saveAndEnable = () => {
    dispatch({
      type: 'plugins/enablePlugin',
      payload: {
        id: pluginId,
        jsonData: meta.jsonSetting,
        secureJsonData: meta.secureJsonData,
      },
      callback: () => {
        meta.enabled = true;
        Message.success('Plugin enabled');
      },
    });
  };

  const disablePlugin = (id: string) => {
    dispatch({
      type: 'plugins/disablePlugin',
      payload: { id },
      callback: () => {
        meta.enabled = false;
        Message.success('Plugin disabled');
      },
    });
  };
  const uninstallPlugin = (id: string) => {
    dispatch({
      type: 'plugins/uninstallPlugin',
      payload: { id },
      callback: () => {
        const history = locationService.getHistory();
        history.push('/plugins');
      },
    });
  };

  const AppConfigPage = app.configPages.body;
  const description = meta.info?.description;

  return (
    <div className="plugin-config">
      <Loading visible={loading.models.plugins ?? false} fullScreen={true} />
      <div className="plugin-head">
        <Breadcrumb
          items={[{ to: '/manage/plugins', title: <Translation>VelaUX Plugins</Translation> }, { title: meta.name }]}
        />
        <div className="plugin-head-main">
          <PluginLogo src={meta.info?.logos?.large} />
          <div className="plugin-head-text">
            <div className="plugin-head-title">
              <h1 className="plugin-head-name">{meta.name}</h1>
              <StatusBadge tone={isEnabled ? 'healthy' : 'neutral'} label={isEnabled ? 'Enabled' : 'Disabled'} />
            </div>
            <div className="plugin-head-meta">
              {description && <span>{description}</span>}
              {meta.info?.version && (
                <span>
                  <Translation>Version</Translation> {meta.info.version}
                </span>
              )}
              <span>
                <Translation>Author</Translation> {meta.info?.author?.name ?? i18n.t('Unknown')}
              </span>
            </div>
          </div>
          <div className="plugin-head-actions">
            {isEnabled ? (
              <Button warning={true} onClick={() => disablePlugin(pluginId)}>
                <Translation>Disable</Translation>
              </Button>
            ) : (
              <Button type="primary" onClick={saveAndEnable}>
                <Translation>Enable</Translation>
              </Button>
            )}
            {isInstalled && (
              <Button disabled={meta?.addon === undefined} warning={true} onClick={() => uninstallPlugin(pluginId)}>
                <Translation>Uninstall</Translation>
              </Button>
            )}
          </div>
        </div>
      </div>
      <nav className="plugin-tabs" role="tablist">
        <span className="plugin-tab active" role="tab">
          <AiOutlineSetting />
          <Translation>Config</Translation>
        </span>
      </nav>
      <div className="plugin-config-card">
        <AppConfigPage
          plugin={app}
          query={{}}
          onJSONDataChange={handleJSONChange}
          onSecureJSONDataChange={handleSecureJSONChange}
        />
        <div className="plugin-config-footer">
          <Button type="primary" onClick={saveSetting}>
            <Translation>Save</Translation>
          </Button>
        </div>
      </div>
    </div>
  );
}

async function loadAppPlugin(
  pluginId: string,
  setApp: React.Dispatch<React.SetStateAction<AppPagePlugin | undefined>>
) {
  try {
    const app = await getPluginSrv().loadMeta(pluginId);
    if (app && 'type' in app) {
      return importAppPagePlugin(app)
        .then((pageApp) => {
          setApp(pageApp);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } catch (err) {
    console.log(err);
  }
}

const mapStateToProps = (store: any) => ({
  ...store.plugins,
  loading: store.loading,
});

export const AppConfigPage = connect(mapStateToProps)(ConfigPage);
export const AppRootPage = connect(mapStateToProps)(RootPage);
