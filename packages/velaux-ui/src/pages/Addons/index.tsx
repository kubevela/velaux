import { Button, Loading, Message, Tab } from '@alifd/next';
import { connect } from 'dva';
import React from 'react';

import { If } from '../../components/If';
import { ListTitle } from '../../components/ListTitle';
import Permission from '../../components/Permission';
import { Translation } from '../../components/Translation';
import type { Addon, AddonBaseStatus } from '@velaux/data';

import CardContend from './components/card-conten/index';
import AddonDetailDialog from './components/detail/index';
import RegistryManageDialog from './components/registry-manage/index';
import SelectSearch from './components/search/index';
import Plugin from "./components/plugin";

type Props = {
  history: any;
  plugin: boolean
  dispatch: ({}) => {};
  loading: any;
  match?: any;

  // addon props
  addonsList: Addon[];
  registryList: [];
  addonListMessage: string;
  enabledAddons?: AddonBaseStatus[];
};

type State = {
  showAddonDetail: boolean;
  addonName: string;
  showRegistryManage: boolean;
  tagList?: Array<{ tag: string; num: number }>;
  selectTags: string[];
};

@connect((store: any) => {
  return { ...store.addons, loading: store.loading };
})
class Addons extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showAddonDetail: false,
      addonName: '',
      showRegistryManage: false,
      selectTags: [],
    };
  }

  componentDidMount() {
    this.getAddonsList();
    this.getAddonRegistriesList();
    this.getEnabledAddon();
  }

  getAddonsList = async (params = {}) => {
    this.props.dispatch({
      type: 'addons/getAddonsList',
      payload: params,
      callback: () => {
        const { match } = this.props;
        if (match && match.params && match.params.addonName) {
          this.openAddonDetail(match.params.addonName);
        }
        this.generateTagList();
      },
    });
  };

  generateTagList = () => {
    const { addonsList } = this.props;
    const tagMap: Map<string, number> = new Map<string, number>();
    addonsList.map((addon) => {
      addon.tags?.map((tag) => {
        const old = tagMap.get(tag);
        tagMap.set(tag, old ? old + 1 : 1);
      });
    });
    const list: { tag: string; num: number }[] = [];
    tagMap.forEach((v: number, key: string) => {
      list.push({ tag: key, num: v });
    });
    list.sort((a, b) => {
      return b.num - a.num;
    });

    this.setState({ tagList: list });
  };

  getEnabledAddon = async () => {
    this.props.dispatch({
      type: 'addons/getEnabledAddons',
      payload: {},
    });
  };

  getAddonRegistriesList = async () => {
    this.props.dispatch({
      type: 'addons/getAddonRegistriesList',
      payload: {},
    });
  };
  openAddonDetail = (addonName: string) => {
    this.setState({ showAddonDetail: true, addonName: addonName });
  };
  closeAddonDetail = () => {
    this.setState({ showAddonDetail: false, addonName: '' });
  };

  onShowAddon = (addonName: string) => {
    const { addonsList = [] } = this.props;
    addonsList.map((item: any) => {
      if (item.name == addonName) {
        this.setState({ showAddonDetail: false, addonName: '' }, () => {
          this.openAddonDetail(addonName);
        });
      }
    });
  };

  render() {
    const {
      addonsList = [],
      registryList = [],
      history,
      dispatch,
      loading,
      addonListMessage,
      enabledAddons,
      plugin
    } = this.props;

    const addonLoading = loading.models.addons;
    const pluginLoading = loading.models.plugins;
    const { showAddonDetail, addonName, showRegistryManage, tagList, selectTags } = this.state;

    return (
      <div>
        <ListTitle
          title="Addons and VelaUX Plugins"
          subTitle="Manages extended platform capabilities for KubeVela and VelaUX."
        />

        <Tab defaultActiveKey={plugin ? 'plugins' : 'addons'}
             onChange={key => {
               history.push('/' + (key == 'plugins' ? "manage/" : "") + key)
             }}>
          <Tab.Item title="Addons" key={'addons'}>
            <SelectSearch
              dispatch={dispatch}
              tagList={tagList}
              registries={registryList}
              listFunction={this.getAddonsList}
              onTagChange={(tags: string[]) => {
                this.setState({ selectTags: tags });
              }}
              extButtons={[
                <Permission request={{ resource: 'addonRegistry:*', action: 'list' }} project={''}>
                  <Button
                    type="primary"
                    onClick={() => {
                      this.setState({ showRegistryManage: true });
                    }}
                  >
                    <Translation>Addon Registries</Translation>
                  </Button>
                </Permission>,
              ]}
            />
            <Loading visible={addonLoading} style={{ width: '100%' }}>
              <If condition={addonListMessage}>
                <Message style={{ marginBottom: '16px' }} type="warning">
                  {addonListMessage}
                </Message>
              </If>
              <CardContend
                addonLists={addonsList}
                selectTags={selectTags}
                enabledAddons={enabledAddons}
                clickAddon={this.openAddonDetail}
              />
            </Loading>
            <If condition={showAddonDetail}>
              <AddonDetailDialog
                onClose={this.closeAddonDetail}
                showAddon={this.onShowAddon}
                dispatch={dispatch}
                addonName={addonName}
              />
            </If>
            <If condition={showRegistryManage}>
              <RegistryManageDialog
                visible={showRegistryManage}
                onClose={() => {
                  this.getAddonsList();
                  this.setState({ showRegistryManage: false });
                }}
                syncRegistries={this.getAddonRegistriesList}
                registries={registryList}
                dispatch={dispatch}
              />
            </If>
          </Tab.Item>
          <Tab.Item title="VelaUX Plugins" key={'plugins'}>
            <Loading visible={pluginLoading} style={{ width: '100%' }}>
              <Plugin
                dispatch={dispatch}
                history={history}
              ></Plugin>
            </Loading>
          </Tab.Item>
        </Tab>

      </div>
    );
  }
}

export default Addons;
