import React, { Component } from 'react';
import './index.less';
import { Button, Dialog, Dropdown, Grid, Menu } from '@alifd/next';
import axios from 'axios';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import {
  AiFillSetting,
  AiOutlineCode,
  AiOutlinePicLeft,
  AiOutlinePicRight,
  AiOutlineQuestionCircle,
} from 'react-icons/ai';

import logo from '../../assets/kubevela-logo-white.png';
import { If } from '../../components/If';
import Permission from '../../components/Permission';
import SwitchLanguage from '../../components/SwitchButton/index';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import type { AddonBaseStatus , Config , SystemInfo , LoginUserInfo } from '@velaux/data';
import { getData, setData } from '../../utils/cache';
import { locale } from '../../utils/locale';
import { getBrowserNameAndVersion } from '../../utils/utils';
import CloudShell from '../CloudShell';
import { locationService } from '../../services/LocationService';

import { LayoutMode, Workspace } from '@velaux/data';
import { Dispatch } from 'redux';
import { menuService } from '../../services/MenuService';
import classNames from 'classnames';

type Props = {
  dispatch: Dispatch;
  mode: LayoutMode;
  userInfo?: LoginUserInfo;
  systemInfo?: SystemInfo;
  show?: boolean;
  enabledAddons?: AddonBaseStatus[];
  currentWorkspace?: Workspace;
};

type State = {
  platformSetting: boolean;
  grafanaConfigs?: Config[];
  workspaces: Workspace[];
};

const TelemetryDataCollectionKey = 'telemetryDataCollection';
const TelemetryDataCollectionServer = 'https://telemetry.kubevela.net/collecting';
@connect((store: any) => {
  return { ...store.user, ...store.cloudshell, ...store.addons };
})
class Header extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      platformSetting: false,
      workspaces: [],
    };
  }

  componentDidMount() {
    this.loadSystemInfo();
    this.loadUserInfo();
    this.loadEnabledAddons();
  }

  loadWorkspaces = () => {
    const { userInfo } = this.props;
    menuService.loadPluginMenus().then(() => {
      this.setState({
        workspaces: menuService.loadWorkspaces(userInfo),
      });
    });
  };

  loadSystemInfo = () => {
    this.props.dispatch({
      type: 'user/getSystemInfo',
      callback: () => {
        this.telemetryDataCollection();
      },
    });
  };

  loadEnabledAddons = () => {
    this.props.dispatch({
      type: 'addons/getEnabledAddons',
      payload: {},
    });
  };

  telemetryDataCollection = async () => {
    const { systemInfo } = this.props;
    if (!getData(TelemetryDataCollectionKey) && systemInfo?.enableCollection) {
      try {
        axios
          .post(TelemetryDataCollectionServer, this.buildTelemetryData())
          .catch()
          .then(() => {
            this.setCache();
          });
      } catch {}
    }
  };

  buildTelemetryData = () => {
    const { systemInfo } = this.props;
    return {
      platformID: systemInfo?.platformID,
      installTime: systemInfo?.installTime,
      version: (systemInfo?.systemVersion?.velaVersion || '') + +'/' + (systemInfo?.systemVersion?.gitVersion || ''),
      clusterCount: systemInfo?.statisticInfo.clusterCount || '',
      appCount: systemInfo?.statisticInfo.appCount || '',
      enableAddonList: systemInfo?.statisticInfo.enableAddonList || {},
      componentDefinitionTopList: systemInfo?.statisticInfo.componentDefinitionTopList,
      traitDefinitionTopList: systemInfo?.statisticInfo.traitDefinitionTopList,
      workflowStepDefinitionTopList: systemInfo?.statisticInfo.workflowDefinitionTopList,
      policyDefinitionTopList: systemInfo?.statisticInfo.policyDefinitionTopList,
      browserInfo: {
        language: navigator.language,
        nameAndVersion: getBrowserNameAndVersion(),
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
      },
    };
  };

  setCache = () => {
    const now = new Date();
    now.setHours(now.getHours() + 24);
    setData(TelemetryDataCollectionKey, 'true', now);
  };

  loadUserInfo = () => {
    this.props.dispatch({
      type: 'user/getLoginUserInfo',
      callback: () => {
        this.loadWorkspaces();
      },
    });
  };

  onLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.props.dispatch(
      routerRedux.push({
        pathname: '/login',
      })
    );
  };

  checkEnabledAddon = (addonName: string) => {
    const { enabledAddons } = this.props;
    if (!enabledAddons) {
      return false;
    }
    const addonNames = enabledAddons.map((addon) => {
      return addon.name;
    });
    if (addonNames.includes(addonName)) {
      return true;
    }
    return false;
  };

  onOpenCloudShell = () => {
    if (!this.checkEnabledAddon('cloudshell')) {
      Dialog.alert({
        title: i18n.t('CloudShell feature is not enabled').toString(),
        content: i18n.t('You must enable the CloudShell addon').toString(),
        locale: locale().Dialog,
        footer: (
          <Button
            type="secondary"
            onClick={() => {
              this.props.dispatch(
                routerRedux.push({
                  pathname: '/addons/cloudshell',
                })
              );
            }}
          >
            <Translation>Go to enable</Translation>
          </Button>
        ),
      });
      return;
    }
    this.props.dispatch({
      type: 'cloudshell/open',
    });
  };

  render() {
    const { Row } = Grid;
    const { show, userInfo, mode, currentWorkspace } = this.props;
    const { workspaces } = this.state;

    return (
      <div className="layout-top-bar" id="layout-top-bar">
        <Row className="nav-wrapper">
          <div
            className="cycle-mode"
            onClick={() => {
              switch (mode) {
                case 'default':
                  locationService.partial({ 'layout-mode': 'neat' });
                  break;
                default:
                  locationService.partial({ 'layout-mode': 'default' });
              }
            }}
          >
            {mode === 'default' && <AiOutlinePicLeft size={20}></AiOutlinePicLeft>}
            {mode === 'neat' && <AiOutlinePicRight size={20}></AiOutlinePicRight>}
          </div>
          <div className="logo">
            <img src={logo} title={'Make shipping applications more enjoyable.'} />
          </div>
          <div style={{ flex: '1 1 0%' }}>
            <div className="workspace-items">
              {workspaces.map((ws) => {
                return (
                  <Link
                    className={classNames('item', { active: currentWorkspace?.name === ws.name })}
                    to={ws.rootRoute}
                    key={'workspace' + ws.name}
                  >
                    <div>
                      {ws.icon}
                      <span>
                        <Translation>{ws.label || ws.name}</Translation>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="right">
            <Permission request={{ resource: 'cloudshell', action: 'create' }}>
              <div className="vela-item" title="Open Cloud Shell" onClick={this.onOpenCloudShell}>
                <AiOutlineCode size={18} />
              </div>
            </Permission>
            <Permission request={{ resource: 'systemSetting', action: 'update' }}>
              <Link to="/settings">
                <div className="vela-item">
                  <AiFillSetting size={18} title={'Platform Settings'} />
                </div>
              </Link>
            </Permission>

            <div className="vela-item">
              <a
                style={{
                  lineHeight: '14px',
                }}
                title="KubeVela Documents"
                href="https://kubevela.io"
                target="_blank"
                rel="noopener noreferrer"
              >
                <AiOutlineQuestionCircle size={18} />
              </a>
            </div>

            <If condition={userInfo}>
              <Dropdown
                trigger={
                  <div className="user-item vela-item" title={userInfo?.alias ? userInfo.alias : userInfo?.name}><svg
                      viewBox="0 0 1024 1024"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      p-id="3724"
                      width="24"
                      height="24"
                    >
                      <path
                        d="M528.517527 1005.894564l-4.436089-5.158243zM528.517527 1005.894564l3.301276-4.487672-3.301276 4.487672zM512.011148 1023.742088a517.784506 517.784506 0 0 0 52.871998-2.682287H458.984402a517.732924 517.732924 0 0 0 53.026746 2.682287zM1023.863673 511.889562a511.852526 511.852526 0 1 0-781.886585 434.839947c32.754848-51.582437 90.1661-82.5319 146.545705-107.704129a3.765518 3.765518 0 0 1 1.083231-0.257913 1.134814 1.134814 0 0 1 0.567407-0.773736h0.464241a1.134814 1.134814 0 0 1 1.134814 0.567407l0.773737 1.392726a3.146529 3.146529 0 0 1 0.722154 1.237978c32.961177 59.165056 85.007857 109.20002 130.864643 159.905556l7.737366 0.464242c19.240249-26.203878 38.893158-52.149844 58.391319-78.198975 21.251964-28.421923 46.424194-55.45112 58.339737-89.443947a2.063297 2.063297 0 0 1 2.682286-1.083231 2.630704 2.630704 0 0 1 2.166463-1.031649h0.825319c38.067839 13.153522 82.5319 27.183944 115.183582 51.582438a144.430825 144.430825 0 0 1 38.377334 46.424193 511.233537 511.233537 0 0 0 216.027247-417.920907z"
                        fill="#65D5A5"
                        p-id="3725"
                      />
                      <path
                        d="M653.450191 831.442761a2.630704 2.630704 0 0 0-2.166463 1.031649 2.630704 2.630704 0 0 1 2.166463-1.031649zM651.283728 832.629157a2.063297 2.063297 0 0 0-0.773736 0 2.063297 2.063297 0 0 1 0.773736 0zM391.720904 838.457973l0.773736 1.392726a3.146529 3.146529 0 0 1 0.722154 1.237978c32.961177 59.165056 85.007857 109.20002 130.864644 159.905556-45.805204-50.705536-98.006631-100.7405-130.864644-159.905556a3.146529 3.146529 0 0 0-0.722154-1.237978l-0.773736-1.392726a1.134814 1.134814 0 0 0-1.134814-0.567407 1.134814 1.134814 0 0 1 1.134814 0.567407zM388.522793 839.076962a3.765518 3.765518 0 0 1 1.083231-0.257912 1.134814 1.134814 0 0 1 0.567407-0.773737h0.412659-0.464242a1.134814 1.134814 0 0 0-0.567407 0.773737 3.765518 3.765518 0 0 0-1.083231 0.257912c-56.328022 25.378559-113.739274 56.070109-146.494122 107.704129 32.754848-51.63402 90.1661-82.32557 146.545705-107.704129zM769.459092 883.334693c-32.548518-24.398493-77.115744-38.480498-115.183582-51.582437h-0.825319 0.825319c38.067839 13.153522 82.5319 27.183944 115.183582 51.582437a144.430825 144.430825 0 0 1 38.377334 46.424194 144.430825 144.430825 0 0 0-38.377334-46.424194zM531.818803 1001.664805l-7.737365-0.464242 4.436089 5.158243z"
                        fill="#3A4942"
                        p-id="3726"
                      />
                      <path
                        d="M769.40751 883.334693c-32.548518-24.398493-77.115744-38.480498-115.183583-51.582437h-0.825319a2.630704 2.630704 0 0 0-2.11488 1.031649 2.011715 2.011715 0 0 0-2.682286 1.083231c-11.709213 33.992826-37.139355 61.022023-58.339737 89.443946-19.498161 25.791219-39.15107 51.995097-58.391319 78.198975l-3.301276 4.487672-4.43609-5.158243c-45.805204-50.705536-98.006631-100.7405-130.864643-159.905556a3.146529 3.146529 0 0 0-0.722154-1.237979l-0.773737-1.392725a1.134814 1.134814 0 0 0-1.134814-0.567407h-0.412659a1.134814 1.134814 0 0 0-0.567407 0.773736 3.765518 3.765518 0 0 0-1.083231 0.257912c-56.431186 25.688054-113.842439 56.379604-146.597287 108.013624a508.190173 508.190173 0 0 0 217.007314 74.27871h105.847161a509.376569 509.376569 0 0 0 242.95328-91.610409 144.430825 144.430825 0 0 0-38.377333-46.114699z"
                        fill="#3A4942"
                        p-id="3727"
                      />
                      <path
                        d="M590.210123 923.2595c21.251964-28.421923 46.424194-55.45112 58.339736-89.443947a2.063297 2.063297 0 0 1 1.90855-1.237978 2.063297 2.063297 0 0 0-1.90855 1.237978c-11.709213 33.992826-37.139355 61.022023-58.339736 89.443947-19.498161 25.791219-39.15107 51.995097-58.39132 78.198975 19.240249-26.255461 38.893158-52.149844 58.39132-78.198975z"
                        fill="#3A4942"
                        p-id="3728"
                      />
                      <path
                        d="M637.253305 811.893018c-24.862735-36.107706-39.460565-71.132181-38.53208-115.75099a12.534532 12.534532 0 0 0-15.474731-12.637697 13.978841 13.978841 0 0 0-3.146529-2.785452c-37.44885-23.831086-85.884758-17.847523-125.91273-3.559188a10.316487 10.316487 0 0 0-6.241475 6.860464 8.717432 8.717432 0 0 0-7.273123 11.296554c12.225038 52.304591-6.396222 87.071154-30.639968 131.174138a96.149663 96.149663 0 0 0-9.645916 75.310359c17.692776 59.990375 79.746448 87.690143 138.550427 84.285703 56.740681-3.198111 113.481362-31.620034 122.095629-93.157882 4.281342-30.846298-6.602552-56.070109-23.779504-81.036009z"
                        fill="#DED8B9"
                        p-id="3729"
                      />
                      <path
                        d="M742.584642 450.145384a346.479232 346.479232 0 0 0 0.670572-81.603415c-17.176952-134.475414-196.529086-119.980749-294.948377-119.258596-59.113473 0.412659-94.705355 29.453572-110.541163 85.987924a434.582035 434.582035 0 0 0-14.855742 120.187079 28.937747 28.937747 0 0 0-26.152296 8.769014c-10.316487 11.141806-10.832312 28.473505-9.130091 42.710258s7.118376 29.505154 20.168733 37.190937a30.382056 30.382056 0 0 0 22.902602 3.559189c0.361077 2.166462 0.670572 4.332925 1.031649 6.499387a7.531036 7.531036 0 0 0 1.444308 3.40444 262.554606 262.554606 0 0 0 45.392545 107.033558c61.898925 84.182538 176.257188 107.755712 258.324846 38.480498 43.58716-36.778278 69.275213-89.031287 83.769879-143.296011 1.186396-4.43609 2.372792-8.923762 3.507605-13.514598a10.935477 10.935477 0 0 0 4.43609 0.618989c42.452346-2.32121 50.292876-86.297418 13.97884-96.768653z"
                        fill="#EBE6CB"
                        p-id="3730"
                      />
                      <path
                        d="M652.779619 834.950367a4.539254 4.539254 0 0 0 0-1.753803 49.622305 49.622305 0 0 0-9.594333-16.248468 81.964493 81.964493 0 0 0-12.637697-14.030422 3.094946 3.094946 0 0 0-2.837034-0.61899 4.745584 4.745584 0 0 0-8.201608-2.11488 102.442721 102.442721 0 0 1-45.186215 28.164011 4.642419 4.642419 0 0 0-6.035145-2.011715 118.639606 118.639606 0 0 1-42.916588 8.511102c-11.915543 0-23.470009-3.971848-35.179222-2.269627h-0.361078a141.490626 141.490626 0 0 1-28.37034-7.427871c-13.153522-5.158244-22.799437-14.855742-35.024475-21.200382a4.590837 4.590837 0 0 0-8.356355-2.940199c-46.424194 61.898925-67.057169 124.055762-55.24479 200.552517a522.478508 522.478508 0 0 0 168.313493 22.077283 528.049411 528.049411 0 0 0 172.543253-37.139355c5.570903-65.561278-12.947192-97.645554-50.911866-151.549201z"
                        fill="#F5F4F4"
                        p-id="3731"
                      />
                      <path
                        d="M761.102738 458.604904a3.765518 3.765518 0 0 0 0.257912-1.134813c3.920265-52.871998 6.499387-108.735778-15.474732-158.409665-19.033919-44.154566-55.812197-69.481543-99.760433-86.606913-53.800482-20.632975-116.731056-34.044409-174.658133-27.854516-38.428916 4.22976-84.801527 22.128866-93.312629 63.962222-95.427509-6.13831-81.706581 128.956093-79.694866 197.715483-0.618989 2.940199-1.134814 5.880398-1.599056 8.820596a5.158244 5.158244 0 0 0 1.753803 4.487673v3.146528l-0.567407 0.618989a1.392726 1.392726 0 0 0 2.166463 1.650638c10.316487-9.439586 24.037416-3.456023 29.505154 7.685784s2.063297 22.180448 2.888616 33.580166a1.70222 1.70222 0 0 0 1.805386 1.599056 2.11488 2.11488 0 0 0 2.321209 1.289561 88.824957 88.824957 0 0 1 9.078509-1.237979 18.260183 18.260183 0 0 0 7.479454-1.083231 1.856968 1.856968 0 0 0 1.031649-1.90855 1.444308 1.444308 0 0 0 2.166462-1.289561c1.650638-29.401989 25.223812-43.1745 41.884939-63.807475a167.797669 167.797669 0 0 0 22.954185-37.552014 171.305274 171.305274 0 0 0 11.967125-39.3574c13.153522 26.564955 51.118195 42.865005 77.373656 53.078328a259.356495 259.356495 0 0 0 89.495529 17.486446c27.441857 0.722154 58.752396 1.392726 82.5319 14.288335l0.412659 0.309495 2.682287 1.444308a63.549563 63.549563 0 0 1 25.017482 27.751352c0.464242 3.404441 0.773737 6.808882 1.134814 10.316487 0 1.856968 0 3.8171 0.361077 5.570903a1.90855 1.90855 0 0 0 0.876901 2.991782h0.464242l0.464242 0.722154a1.960133 1.960133 0 0 0 2.630704 0 17.486446 17.486446 0 0 0 11.244972 0.722154 1.753803 1.753803 0 0 0 0.670571-0.618989 2.063297 2.063297 0 0 0 3.404441-1.547474 77.373656 77.373656 0 0 1 3.249694-28.060845 15.784226 15.784226 0 0 1 9.336421-10.316488 9.749081 9.749081 0 0 1 11.451301 7.118376 1.134814 1.134814 0 0 0 2.11488-0.257912 8.820597 8.820597 0 0 0 0-1.289561l1.444308 1.031649c2.785452 1.960133 5.467738-2.630704 2.682287-4.539254z"
                        fill="#333333"
                        p-id="3732"
                      />
                      <path
                        d="M486.219929 827.883573c-14.3915-1.90855-53.54257-12.27662-61.898925-29.556736a6.602552 6.602552 0 0 0-0.773737-2.218045 13.617763 13.617763 0 0 1-0.464241-1.495891 2.888616 2.888616 0 0 0-4.281343-1.856968 4.745584 4.745584 0 0 0-4.075012 1.960133c-17.950688 22.077283-31.465287 34.302321-14.752577 61.898925a212.313312 212.313312 0 0 0 60.867276 62.982156 5.622486 5.622486 0 0 0 8.407937-4.797167 154.747312 154.747312 0 0 1 21.097217-79.230624 5.158244 5.158244 0 0 0-4.281342-7.479453z m147.009946-32.548518a5.93198 5.93198 0 0 0-1.341143-0.722154 5.622486 5.622486 0 0 0-9.233256-2.579122 135.042821 135.042821 0 0 1-53.852065 30.949463 4.02343 4.02343 0 0 0-2.579122 5.880398 3.352858 3.352858 0 0 0 0.361077 2.682286c12.586115 21.509876 20.117151 42.400764 15.216819 67.469828a5.622486 5.622486 0 0 0 6.808882 6.808882c38.119421-14.855742 86.710077-74.949281 44.618808-110.437998z"
                        fill="#EBEAEA"
                        p-id="3733"
                      />
                      <path
                        d="M624.306114 1011.259138c-0.412659-21.613041-2.218045-33.477002-4.281343-54.728966a222.990877 222.990877 0 0 0 54.264724-15.784226 2.888616 2.888616 0 0 0 1.753803-3.301276 1.186396 1.186396 0 0 0 0-0.567407c3.559188-33.270672-11.296554-71.699588-19.652908-103.474369a3.105263 3.105263 0 0 0-5.983563 1.650638c9.594333 32.290606 10.677565 69.223631 22.85102 100.379423h-0.567407c-18.2086 6.293057-36.984608 10.316487-55.296373 16.248468a3.094946 3.094946 0 0 0-4.43609 2.940199c1.031649 22.128866 1.805385 36.107706 3.971848 58.184989M430.768809 1017.139536c4.539254-18.724425 3.868683-47.765337 0-73.504973a1.495891 1.495891 0 0 0-1.650638-1.341144 3.146529 3.146529 0 0 0-2.52754-1.753803c-11.606048-1.444308-23.160514-2.527539-34.611815-5.158243-7.995278-1.753803-15.784226-4.281342-23.882669-5.158244 6.55097-16.919039 10.987059-34.869728 16.042138-52.253009 2.940199-10.316487 11.348136-25.791219 7.737366-36.107706a2.11488 2.11488 0 0 0-4.126595 0.567407c-1.083231 14.030423-8.975344 30.020979-13.050357 43.638742-4.539254 15.062072-9.749081 30.175726-12.740862 45.598874a2.579122 2.579122 0 0 0 1.753803 3.146529c17.641194 9.439586 42.916588 11.502884 62.724244 12.07029a601.863879 601.863879 0 0 0-4.332925 69.172049"
                        fill="#1A1B19"
                        p-id="3734"
                      />
                      <path
                        d="M581.389526 1019.460746a1354.709552 1354.709552 0 0 0-32.342188-134.475415 3.868683 3.868683 0 0 0 3.301276-2.630704c5.158244-14.855742 11.863961-33.786496 9.284838-50.034964a5.158244 5.158244 0 0 0-2.682286-6.55097 5.158244 5.158244 0 0 0-2.837035-0.309494c-3.043364 0.722154-6.086728 1.237978-9.130091 1.650638a156.294785 156.294785 0 0 1-17.383281 0.928484 106.311403 106.311403 0 0 1-18.002271-1.960133 3.559188 3.559188 0 0 0-3.662353 1.289561l-6.808882-0.309495a1.599056 1.599056 0 0 0-1.753803 1.392726 1.650638 1.650638 0 0 0 0 0.309495 3.198111 3.198111 0 0 0-1.031648 2.991781 184.510378 184.510378 0 0 0 7.943695 25.791219 111.985471 111.985471 0 0 0 8.872179 22.696272 3.043364 3.043364 0 0 0 0.876902 0.928484 2.063297 2.063297 0 0 0 1.083231 1.753803l0.515824 0.361077a2.424375 2.424375 0 0 0-0.309494 0.773736 1220.646797 1220.646797 0 0 0-19.807656 138.859922 418.591479 418.591479 0 0 0 43.587159 0.464242 373.766341 373.766341 0 0 0 40.285884-3.920265z"
                        fill=""
                        p-id="3735"
                      />
                      <path
                        d="M541.155225 1023.329428c19.859238-0.618989 40.027971-5.158244 40.234301-3.868682a1354.709552 1354.709552 0 0 0-32.342188-134.475415"
                        fill=""
                        p-id="3736"
                      />
                    </svg>
                    <span>{userInfo?.alias ? userInfo.alias : userInfo?.name}</span>
                  </div>
                }
              >
                <Menu>
                  <Menu.Item onClick={this.onLogout}>
                    <Translation>Logout</Translation>
                  </Menu.Item>
                </Menu>
              </Dropdown>
            </If>
            <div className="vela-item">
              <SwitchLanguage />
            </div>
          </div>
        </Row>
        <If condition={show}>
          <CloudShell />
        </If>
      </div>
    );
  }
}

export default Header;
