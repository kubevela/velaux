import { AppPagePlugin, PluginMeta } from '@velaux/data';
import * as React from 'react';
import { Translation } from '../../components/Translation';
import { locationService } from '../../services/LocationService';
import { getPluginSrv, importAppPagePlugin } from '../../services/PluginService';
import { Box, Button, Divider, Grid, Loading, Tab } from "@alifd/next";
import './index.less'
import { connect } from "dva";
import { checkImage, renderIcon } from "../../utils/icon";

interface Props {
  pluginId: string;
  dispatch: any;
  loading: any;
  pluginList: PluginMeta[];
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

function ConfigPage({ pluginId, dispatch, loading, pluginList }: Props) {
  const [valid, setValid] = React.useState(false)
  const [app, setApp] = React.useState<AppPagePlugin>();
  console.log( pluginId, dispatch, loading, pluginList )
  console.log('pluginList', pluginList)
  const meta = pluginList.filter(item => item.id === pluginId)[0]
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
  }, [meta, pluginId]);
  if (!app || !app.configPages) {
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
    console.log('dispatch', dispatch)
    dispatch({
      type: 'plugins/enablePlugin',
      payload: { id },
      callback: () => {
        location.reload()
      }
    });
  }
  const disablePlugin = (id: string) => {
    dispatch({
      type: 'plugins/disablePlugin',
      payload: { id },
      callback: () => {
        location.reload()
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
  const pluginLoading = loading.models.plugins || false
  checkImage(meta.info.logos.large, (valid) => {
    setValid(valid)
  })

  const AppConfigPage = app.configPages.body

  return (
    <>
      <Loading visible={pluginLoading} style={{ width: '100%' }} />
      <Box className={'page-header'} direction={'row'} spacing={12}>
        <span className={'page-header-logo'}>
          {renderIcon(meta.id, valid, meta.info.logos.large)}
        </span>
        <Box direction={'column'}>
          <h1 className={'page-header-title'}>{meta.name}</h1>
          <Row className={'basic-info font-size-16'}>
            <Col>
              <div>Version</div>
              <div>{meta.info.version}</div>
            </Col>
            <Col>
              <Divider direction="ver" style={{ height: '100%' }} />
            </Col>
            <Col>
              <Box direction={'column'}>
                <div>Author</div>
                <div>{meta.info.author?.name ?? "Unknown"}</div>
              </Box>
            </Col>
            <Col>
              <Divider direction="ver" style={{ height: '100%' }} />
            </Col>
            <Col className={'info-item'}>
              <div>Status</div>
              <div>{
                meta.enabled ? <Translation>Enabled</Translation> : <Translation>Disabled</Translation>
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
            {
              isInstalled && isEnabled &&
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
          <AppConfigPage plugin={app} query={{}} />
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
      importAppPagePlugin(app)
        .then((pageApp) => {
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
