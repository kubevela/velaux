import React from 'react';
import { connect } from 'dva';
import { Loading } from '@b-design/ui';
import Title from '../../components/ListTitle';
import SelectSearch from './components/search/index';
import CardContend from './components/card-conten/index';
import AddonDetailDialog from './components/detail/index';
import RegistryManageDialog from './components/registry-manage/index';
import Img from '../../assets/plugins.png';
import { If } from 'tsx-control-statements/components';

type Props = {
  dispatch: ({}) => {};
  addonsList: [];
  registryList: [];
  loading: any;
};

type State = {
  showAddonDetail: boolean;
  addonName: string;
  showRegistryManage: boolean;
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
    this.getAddonRegistrysList();
  }

  getAddonsList = async (params = {}) => {
    this.props.dispatch({
      type: 'addons/getAddonsList',
      payload: params,
    });
  };

  getAddonRegistrysList = async () => {
    this.props.dispatch({
      type: 'addons/getAddonRegistrysList',
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
    const { addonsList = [], registryList = [], dispatch, loading } = this.props;

    const isLoading = loading.models.addons;
    const { showAddonDetail, addonName, showRegistryManage } = this.state;
    return (
      <div>
        <Title
          title="Addon in management"
          subTitle="Addon in extension"
          addButtonTitle="Addon Registry Manage"
          addButtonClick={() => {
            this.setState({ showRegistryManage: true });
          }}
        />
        <SelectSearch
          dispatch={dispatch}
          registrys={registryList}
          listFunction={this.getAddonsList}
        />
        <Loading visible={isLoading} style={{ width: '100%' }}>
          <CardContend cardImg={Img} addonLists={addonsList} clickAddon={this.openAddonDetail} />
        </Loading>
        <If condition={showAddonDetail}>
          <AddonDetailDialog
            onClose={this.closeAddonDetail}
            showAddon={this.onShowAddon}
            dispatch={dispatch}
            addonName={addonName}
          ></AddonDetailDialog>
        </If>
        <If condition={showRegistryManage}>
          <RegistryManageDialog
            visible={showRegistryManage}
            onClose={() => {
              this.getAddonsList();
              this.setState({ showRegistryManage: false });
            }}
            syncRegistrys={this.getAddonRegistrysList}
            registrys={registryList}
            dispatch={dispatch}
          ></RegistryManageDialog>
        </If>
      </div>
    );
  }
}

export default Addons;
