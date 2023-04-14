import React from 'react';
import './index.less';

import { Button, Dialog, List } from "@alifd/next";
import type { KeyValue, PluginMeta } from '@velaux/data';
import PluginConfig from "../plugin-config";
import Empty from "../../../../components/Empty";

type State = {
  iconValid: KeyValue<boolean>;
  currentPlugin?: PluginMeta;
  showConfig: boolean;
};

type Props = {
  pluginList?: PluginMeta[];
  enabledPlugins?: PluginMeta[];

  onInstall: (id: string, url: string) => void;
  onUninstall: (id: string) => void;
  onEnable: (id: string) => void;
  onDisable: (id: string) => void;
  // onConfig: (id: string) => void;
};


class Plugin extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      iconValid: {},
      showConfig: false,
    };
  }

  componentDidMount() {
    const { pluginList } = this.props;
    if (pluginList) {
      pluginList.forEach((plugin) => {
        this.checkImage(plugin.name, plugin.info.logos.small);
      });
    }
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    const { pluginList } = this.props;
    if (pluginList && pluginList !== prevProps.pluginList) {
      pluginList.forEach((plugin) => {
        this.checkImage(plugin.name, plugin.info.logos.small);
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
    const { pluginList, enabledPlugins, onInstall, onDisable, onUninstall, } = this.props;
    const { currentPlugin, showConfig } = this.state;

    return (
      <div>
        <Button onClick={
          () => {
            onInstall("node-dashboard", "https://kubevela-assets.oss-cn-beijing.aliyuncs.com/node-dashboard.tar.gz")
          }
        }>
          Install node-dashboard
        </Button>

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
              return <PluginConfig plugin={currentPlugin} />;
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
                  <div>{plugin.name}</div>
                  <div>
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
                      <Button type="primary" onClick={() => onInstall(plugin.id, "")}>
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
                      <Button onClick={() => onDisable(plugin.id)}>Disable</Button>
                    )}
                    {isInstalled && !isEnabled && (
                      <Button warning onClick={() => onUninstall(plugin.id)}>
                        Uninstall
                      </Button>
                    )}
                  </div>
                </div>
              </List.Item>
            );
          })}
        </List>
      </div>
    );
  }
}

export default Plugin;
