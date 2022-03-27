import React from 'react';
import { connect } from 'dva';
import { Loading, Message } from '@b-design/ui';
import Title from '../../components/ListTitle';
import SelectSearch from './components/search/index';
import CardContend from './components/card-conten/index';
import AddonDetailDialog from './components/detail/index';
import RegistryManageDialog from './components/registry-manage/index';
import { If } from 'tsx-control-statements/components';
import { getEnabledAddons } from '../../api/addons';
import type { AddonBaseStatus } from '../../interface/addon';
import i18n from '../../i18n';

type Props = {
  dispatch: ({}) => {};
  addonsList: [];
  registryList: [];
  addonListMessage: string;
  loading: any;
  match?: any;
};

type State = {
  showAddonDetail: boolean;
  addonName: string;
  showRegistryManage: boolean;
  enabledAddons?: AddonBaseStatus[];
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
      },
    });
  };

  getEnabledAddon = async () => {
    getEnabledAddons({}).then((res) => {
      if (res) {
        this.setState({ enabledAddons: res.enabledAddons });
      }
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
    const { addonsList = [], registryList = [], dispatch, loading, addonListMessage } = this.props;

    const isLoading = loading.models.addons;
    const { showAddonDetail, addonName, showRegistryManage, enabledAddons } = this.state;
    return (
      <div>
        <Title
          title="Addons"
          subTitle="Manages and extends platform capabilities"
          addButtonTitle={i18n.t('Addon Registries').toString()}
          addButtonClick={() => {
            this.setState({ showRegistryManage: true });
          }}
        />
        <SelectSearch
          dispatch={dispatch}
          registries={registryList}
          listFunction={this.getAddonsList}
        />
        <Loading visible={isLoading} style={{ width: '100%' }}>
          <If condition={addonListMessage}>
            <Message style={{ marginBottom: '16px' }} type="warning">
              {addonListMessage}
            </Message>
          </If>
          <CardContend
            addonLists={addonsList}
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
      </div>
    );
  }
}

export default Addons;
