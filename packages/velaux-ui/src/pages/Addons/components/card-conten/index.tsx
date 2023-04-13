import React from 'react';
import './index.less';

import { Balloon, Button, Card, Grid, Tag } from '@alifd/next';

import Empty from '../../../../components/Empty';
import { If } from '../../../../components/If';
import { Translation } from '../../../../components/Translation';
import type { Addon, AddonBaseStatus } from '../../../../interface/addon';
import { intersectionArray } from '../../../../utils/common';
import type { PluginMeta } from '@velaux/data';
import { locale } from '../../../../utils/locale';

type State = {
  extendDotVisible: boolean;
  choseIndex: number;
};

type Props = {
  type: "addon" | "plugin";

  // addon related props
  clickAddon?: (name: string) => void;
  addonLists?: Addon[];
  enabledAddons?: AddonBaseStatus[];
  selectTags?: string[];

  // plugin related props
  pluginList?: PluginMeta[];
  enabledPlugins?: PluginMeta[];
  clickPlugin?: (id: string) => void;
};


type item = {
  // id is the primary key of the plugin. There's no id in addons.
  id?: string
  // name is the primary key of the addon. Plugins have name but only for display.
  name: string;
  icon?: string;
  version?: string;
  description?: string;
  tags?: string[]
  registryName?: string
}

type enabledItem = {
  name: string;
  phase?: string
}

function addonToItem(addon: Addon): item {
  return {
    name: addon.name,
    icon: addon.icon,
    version: addon.version,
    description: addon.description,
    tags: addon.tags,
  }
}

function pluginToItem(plugin: PluginMeta): item {
  return {
    id: plugin.id,
    name: plugin.name,
    icon: plugin.info.logos.small,
    version: plugin.latestVersion,
    description: plugin.info.description,
  }
}

function enabledAddonToItem(addon: AddonBaseStatus): enabledItem {
  return {
    name: addon.name,
    phase: addon.phase,
  }
}

function enabledPluginToItem(plugin: PluginMeta): enabledItem {
  return {
    name: plugin.name
  }
}

class CardContent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      extendDotVisible: false,
      choseIndex: 0,
    };
  }

  render() {
    const { Row, Col } = Grid;
    const {
      type,
      addonLists,
      clickAddon,
      clickPlugin,
      enabledAddons,
      selectTags,
      pluginList,
      enabledPlugins,
    } = this.props;

    const getTagColor = (tag: string) => {
      switch (tag) {
        case 'alpha':
          return 'red';
        case 'beta':
          return 'red';
        case 'GA':
          return 'green';
        default:
          return '';
      }
    };
    const nameUpper = (name: string) => {
      return name
        .split('-')
        .map((sep) => {
          if (sep.length > 0) {
            return sep.toUpperCase()[0];
          }
          return sep;
        })
        .toString()
        .replace(',', '');
    };
    const toItem = (x: Addon | PluginMeta): item => {
      if (type === "addon") {
        return addonToItem(x as Addon)
      } else {
        return pluginToItem(x as PluginMeta)
      }
    }
    const toEnabledItem = (x: AddonBaseStatus | PluginMeta): enabledItem => {
      if (type === "addon") {
        return enabledAddonToItem(x as AddonBaseStatus)
      } else {
        return enabledPluginToItem(x as PluginMeta)
      }
    }

    let itemList: item[];
    let enabledItemList: enabledItem[];
    itemList = (type === "addon" ? addonLists?.map(toItem) : pluginList?.map(toItem)) || [];
    enabledItemList = (type === "addon" ? enabledAddons?.map(toEnabledItem) : enabledPlugins?.map(toEnabledItem)) || [];

    const orderItemList: item[] = [];
    itemList.map((item) => {
      const status = enabledItemList?.filter((enabledItem) => {
        return enabledItem.name == item.name;
      });
      if (selectTags && selectTags.length > 0 && !intersectionArray(item.tags, selectTags)?.length) {
        return;
      }
      if (status && status.length > 0 && status[0].phase == 'enabled') {
        orderItemList.unshift(item);
      } else {
        orderItemList.push(item);
      }
    })

    const notice = "This addon is experimental, please don't use it in production";
    return (
      <div>
        <If condition={itemList}>
          <Row wrap={true}>
            {orderItemList.map((it: item) => {
              const { id, name, icon, version, description, tags, registryName } = it;
              const status = enabledAddons?.filter((addonStatus: AddonBaseStatus) => {
                return addonStatus.name == name;
              });
              return (
                <Col xl={4} l={6} m={8} s={12} xxs={24} className={`card-content-wraper`} key={name}>
                  <Card locale={locale().Card} contentHeight="auto">
                    <a onClick={
                      type === 'addon' && clickAddon ? () => clickAddon(name) : undefined
                    }>
                      <div className="cluster-card-top flexcenter">
                        <If condition={icon && icon != 'none' && icon != ''}>
                          <img src={icon} />
                        </If>
                        <If condition={!icon || icon === 'none' || icon === ''}>
                          <div
                            style={{
                              display: 'inline-block',
                              verticalAlign: 'middle',
                              padding: `2px 4px`,
                              width: '60px',
                              height: '60px',
                              borderRadius: '50%',
                              backgroundColor: '#fff',
                              textAlign: 'center',
                              lineHeight: '60px',
                            }}
                          >
                            <span style={{ color: '#1b58f4', fontSize: `2em` }}>{nameUpper(name)}</span>
                          </div>
                        </If>
                      </div>
                    </a>
                    <div className="content-wraper background-F9F8FF">
                      <Row className="content-title">
                        <Col span="16" className="font-size-16">
                          <a onClick={type === 'addon' && clickAddon ? () => clickAddon(name) : undefined}>
                            {name}
                          </a>
                        </Col>
                        <If condition={registryName && registryName == 'experimental'}>
                          <Col span="8" className="flexright">
                            <Balloon trigger={<Tag color="yellow">Experimental</Tag>}>{notice}</Balloon>
                          </Col>
                        </If>
                      </Row>
                      <Row className="content-main">
                        <h4 className="color595959 font-size-14" title={description}>
                          {description}
                        </h4>
                      </Row>
                      <Row className="content-main-btn">
                        {tags?.map((tag: string) => {
                          return (
                            <Tag title={tag} style={{ marginRight: '8px' }} color={getTagColor(tag)} key={tag}>
                              {tag}
                            </Tag>
                          );
                        })}
                      </Row>

                      <Row className="content-foot colorA6A6A6" align={"center"}>
                        <Col span="16">
                          <span>{version || '0.0.0'}</span>
                        </Col>
                        <Col span="8" className="text-align-right padding-right-10">
                          <If condition={type === 'addon'}>
                            <If condition={status && status.length > 0 && status[0].phase == 'enabled'}>
                              <span className="circle circle-success" />
                              <Translation>Enabled</Translation>
                            </If>
                          </If>
                          <If condition={type == 'plugin'}>
                            {
                              (() => {
                                const isEnabled = !!enabledPlugins?.find((p: PluginMeta) => p.id === id);

                                return (
                                  <Button
                                    type={isEnabled ? "normal" : "primary"}
                                    onClick={clickPlugin && id ? () => clickPlugin(id) : undefined}
                                    warning={isEnabled}
                                  >
                                    <Translation>{isEnabled ? "Disable" : "Enable"}</Translation>
                                  </Button>
                                );
                              })()
                            }
                          </If>
                        </Col>
                      </Row>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </If>
        <If condition={!itemList || itemList.length == 0}>
          <Empty style={{ minHeight: '400px' }} />
        </If>
      </div>
    );
  }
}

export default CardContent;
