import React from 'react';
import { connect } from 'dva';
import './index.less';

import { Box, Button, Dialog, List, Message } from "@alifd/next";
import type { KeyValue, PluginMeta } from '@velaux/data';
import PluginConfig from "../plugin-config";
import i18n from "../../../../i18n";
import Empty from "../../../../components/Empty";

type State = {
  iconValid: KeyValue<boolean>;
  currentPlugin?: PluginMeta;
  showConfig: boolean;
};

type Props = {
  dispatch: ({}) => {};
  pluginList?: PluginMeta[];
  enabledPlugins?: PluginMeta[];
  errorMessage?: string;
};


@connect((store: any) => {
  return { ...store.plugins };
})
class Plugin extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      iconValid: {},
      showConfig: false,
    };
  }

  installPlugin(id: string, url: string) {
    this.props.dispatch({
      type: 'plugins/installPlugin',
      payload: { id, url },
      callback: () => {
        Message.success(i18n.t("Install Success. Enabled automatically."));
        this.render()
      }
    });
  }

  uninstallPlugin(id: string) {
    this.props.dispatch({
      type: 'plugins/uninstallPlugin',
      payload: { id },
      callback: () => {
        Message.success(i18n.t("Uninstall Success."));
        this.render()
      }
    });

  }

  enablePlugin(id: string) {
    this.props.dispatch({
      type: 'plugins/enablePlugin',
      payload: { id },
      callback: () => {
        Message.success(i18n.t("Enable Success."));
      }
    });
  }

  disablePlugin(id: string) {
    this.props.dispatch({
      type: 'plugins/disablePlugin',
      payload: { id },
      callback: () => {
        Message.success(i18n.t("Disable Success."));
      }
    });
  }

  componentDidMount() {
    const { pluginList } = this.props;
    if (pluginList) {
      pluginList.forEach((plugin) => {
        if (plugin.name && plugin.info?.logos?.small) {
          this.checkImage(plugin.name, plugin.info.logos.small);
        }
      });
    }
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    const { pluginList } = this.props;
    if (pluginList && pluginList !== prevProps.pluginList) {
      pluginList.forEach((plugin) => {
        if (plugin.name && plugin.info?.logos?.small) {
          this.checkImage(plugin.name, plugin.info.logos.small);
        }
      });
    }
  }

  checkImage = (name: string, icon?: string) => {
    if (icon && icon !== 'none' && icon !== '') {
      const img = new Image();
      img.src = icon;
      img.onload = () => {
        this.setState((preState) => {
          preState.iconValid[name] = true;
          return preState;
        });
      }
      img.onerror = () => {
        this.setState((preState) => {
          preState.iconValid[name] = false;
          return preState;
        });
      }
    } else {
      this.setState((preState) => {
        preState.iconValid[name] = false;
        return preState;
      });
    }
  };

  render() {
    const { pluginList, enabledPlugins, } = this.props;
    const { currentPlugin, showConfig } = this.state;

    return (
      <div>
        <Dialog
          title={`${currentPlugin ? currentPlugin.name : ""} Configuration`}
          visible={showConfig}
          footerActions={[]}
          onClose={() => this.setState({ showConfig: false })}
          style={{ width: '80%', height: '80%', overflow: 'auto' }}
          closeMode={['close', 'esc', 'mask']}
        >
          {(() => {
            if (currentPlugin) {
              return <PluginConfig plugin={currentPlugin} />
            }
            return <Empty />
          })()}
        </Dialog>
        <List className="plugin-list">
          {pluginList?.map((plugin) => {
            const isEnabled = enabledPlugins?.some((p) => p.id === plugin.id);
            const isInstalled = !!plugin.info;

            return (
              <List.Item key={plugin.id} className="plugin-row">
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div>{plugin.id}</div>
                  <div>
                    <Box spacing={8} direction="row">
                      {isInstalled && isEnabled && (
                        <Button onClick={() => {
                          console.log('plugin', plugin)
                          this.setState({
                            currentPlugin: plugin,
                            showConfig: true,
                          }, () => {
                            console.log('currentPlugin', this.state.currentPlugin)
                          })
                        }}>Config</Button>
                      )}

                      {!isInstalled && (
                        <Button type="primary" onClick={() => this.installPlugin(plugin.id, plugin.url)}>
                          Install
                        </Button>
                      )}

                      {isInstalled && !isEnabled && (
                        <Button type={"primary"} onClick={() => {
                          console.log('hit `Enable` plugin', plugin)
                          this.setState({
                            currentPlugin: plugin,
                            showConfig: true,
                          }, () => {
                            console.log('currentPlugin', this.state.currentPlugin)
                          })
                        }}>Enable</Button>
                      )}

                      {isInstalled && isEnabled && (
                        <Button onClick={() => this.disablePlugin(plugin.id)}>Disable</Button>
                      )}

                      {isInstalled && !isEnabled && (
                        <Button warning onClick={() => this.uninstallPlugin(plugin.id)}>
                          Uninstall
                        </Button>
                      )}
                    </Box>
                  </div>
                </div>
              </List.Item>
            );
          })}
        </List>
      </div>
    );
  };
}

export default Plugin;
