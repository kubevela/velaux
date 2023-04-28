import { AppPagePlugin, PluginMeta } from '@velaux/data';
import * as React from 'react';
import { Translation } from '../../components';
import { locationService } from '../../services';
import { getPluginSrv, importAppPagePlugin } from '../../services/PluginService';
import { Box, Button, Divider, Grid, Loading, Message, Tab } from "@alifd/next";
import './index.less'
import { connect } from "dva";
import { checkImage, renderIcon } from "../../utils/icon";
import { KeyValue } from "@velaux/ui";

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

  const AppRootPage = app.root
  return (
    <div>
      <AppRootPage meta={app.meta} basename={locationService.getLocation().pathname} />
    </div>
  );
}

enum types  {
  UPDATE_META
}

function ConfigPage({ pluginId, dispatch, pluginList, loading }: Props) {

  const [valid, setValid] = React.useState(false)
  const [app, setApp] = React.useState<AppPagePlugin>();
  const [jsonData, setJsonData] = React.useState(app?.meta.jsonData ?? {})
  const [secureJsonData, setSecureJsonData] = React.useState(app?.meta.secureJsonData ?? {})
  console.log(jsonData)
  const handleJSONChange = (key: string, value: any) => {
    setJsonData(jsonData.map((item: KeyValue) => {
      if (item.key === key) {
        item.value = value
      }
      return item
    }))
  }
  const handleSecureJSONChange = (key: string, value: any) => {
    setSecureJsonData(secureJsonData.map((item: KeyValue) => {
      if (item.key === key) {
        item.value = value
      }
      return item
    }))
  }
  console.log(handleJSONChange, handleSecureJSONChange)

  const saveSetting = () => {
    console.log('saveSetting', jsonData, secureJsonData)
    dispatch({
      type: 'plugins/setPlugin',
      payload: {
        id: pluginId,
        jsonData: jsonData,
        secureJsonData: secureJsonData,
      },
      callback: () => {
        Message.success('Setting saved')
      }
    })
  }

  const _meta = pluginList.filter(item => item.id === pluginId)[0]
  const updateMeta = (previousState: any, action: any) => {
    if (action.type == types.UPDATE_META) {
      return { ...previousState, ...action.payload }
    }
    throw new Error('Unknown action type')
  }
  const [meta, dispatchMeta] = React.useReducer(updateMeta, _meta);

  // Get PluginMeta
  React.useEffect(() => {
    if (!meta) {
      getPluginSrv().loadMeta(pluginId).then(
        (m) => {
          dispatchMeta({
            type: types.UPDATE_META,
            payload: m
          })
        }
      )
    }
  }, [meta, pluginId])

  // Get whole plugin by PluginMeta
  React.useEffect(() => {
    if (!meta) {
      return
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
    )
  }

  // const meta = app.meta
  const { Col, Row } = Grid

  const isEnabled = meta.enabled
  const isInstalled = !!meta.info

  const enablePlugin = (id: string) => {
    dispatch({
      type: 'plugins/enablePlugin',
      payload: { id },
      callback: () => {
        meta.enabled = true
        Message.success('Plugin enabled')
      }
    });
  }
  const disablePlugin = (id: string) => {
    dispatch({
      type: 'plugins/disablePlugin',
      payload: { id },
      callback: () => {
        meta.enabled = false
        Message.success('Plugin disabled')
      }
    });
  }
  const uninstallPlugin = (id: string) => {
    dispatch({
      type: 'plugins/uninstallPlugin',
      payload: { id },
      callback: () => {
        const history = locationService.getHistory()
        history.push('/plugins')
      }
    });
  }

  const handleGotoPlugins = () => {
    const history = locationService.getHistory()
    history.push('/plugins')
  }
  checkImage(meta.info?.logos.large, (valid) => {
    setValid(valid)
  })

  const AppConfigPage = app.configPages.body

  return (
    <>
      <Loading visible={loading.models.plugins ?? false} fullScreen={true} />
      <Box className={'page-header'} direction={'row'} spacing={12}>
        <span className={'page-header-logo'}>
          {renderIcon(meta.id, valid, meta.info?.logos.large)}
        </span>
        <Box direction={'column'}>
          <h1 className={'page-header-title'}>{
            <>
              <a onClick={handleGotoPlugins}>Plugins</a> / {meta.name}
            </>
          }</h1>
          <Row className={'basic-info font-size-16'}>
            <Col>
              <div className={'info-item-title'}>Version</div>
              <div>{meta.info.version}</div>
            </Col>
            <Col>
              <Divider direction="ver" style={{ height: '100%' }} />
            </Col>
            <Col>
              <Box direction={'column'}>
                <div className={'info-item-title'}>Author</div>
                <div>{meta.info.author?.name ?? "Unknown"}</div>
              </Box>
            </Col>
            <Col>
              <Divider direction="ver" style={{ height: '100%' }} />
            </Col>
            <Col className={'info-item'}>
              <div className={'info-item-title'}>Status</div>
              <div>{
                meta.enabled ? <Translation className={''}>Enabled</Translation> : <Translation>Disabled</Translation>
              }</div>
            </Col>
          </Row>
          <h4 className={'font-size-14'}>{meta.info.description ?? "No descriptions"}</h4>
        </Box>
        <Box style={{ marginLeft: 'auto' }} align={'flex-end'} direction={'row'} justify={'flex-end'}>
          <Row gutter={8}>
            {isInstalled && !isEnabled &&
                <Col>
                  <Button type={'primary'} onClick={() => enablePlugin(pluginId)}>Enable</Button>
                </Col>
            }
            {isEnabled &&
                <Col>
                  <Button type={'primary'} onClick={saveSetting}>Save & Reload</Button>
                </Col>
            }
            {
              isEnabled &&
                <Col>
                  <Button warning={true} onClick={() => disablePlugin(pluginId)}>Disable</Button>
                </Col>
            }
            {
              !isEnabled && isInstalled &&
                <Col>
                  <Button warning={true} onClick={() => uninstallPlugin(pluginId)}>Uninstall</Button>
                </Col>
            }
          </Row>
        </Box>
      </Box>
      <Tab>
        <Tab.Item title={'Config'}>
          <AppConfigPage plugin={app} query={{}} onJSONDataChange={handleJSONChange} onSecureJSONDataChange={handleSecureJSONChange}/>
        </Tab.Item>
      </Tab>
    </>
  )
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
          console.log('pageApp', pageApp)
          setApp(pageApp);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } catch (err) {
    console.log(err)
  }
}

const mapStateToProps = (store: any) => ({
  ...store.plugins, loading: store.loading
})

export const AppConfigPage = connect(mapStateToProps)(ConfigPage)
export const AppRootPage = connect(mapStateToProps)(RootPage)
