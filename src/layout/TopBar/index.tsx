import React, { Component } from 'react';
import './index.less';
import { Button, Dialog, Grid, Icon, Message } from '@b-design/ui';
import SwitchLanguage from '../../components/SwitchButton/index';
import { withTranslation } from 'react-i18next';

import logo from '../../assets/KubeVela.png';
import locale from '../../utils/locale';
import Translation from '../../components/Translation';
import { loadSystemInfo, updateSystemInfo } from '../../api/config';

import type { SystemInfo } from '../../interface/system';
import { If } from 'tsx-control-statements/components';
import { getData, setData } from '../../utils/cache';
import { getEnabledAddons } from '../../api/addons';
import { getClusterList } from '../../api/cluster';
import { getApplicationList } from '../../api/application';
import axios from 'axios';

type Props = {
  t: (key: string) => {};
};

type State = {
  userExperienceImprovementPlan: boolean;
  visible: boolean;
  systemInfo?: SystemInfo;
  userData: {
    installID?: string;
    version?: string;
    installTime?: string;
    appCount?: number;
    clusterCount?: number;
    enableAddList?: string[];
  };
};

class TopBar extends Component<Props, State> {
  loadCount: number;
  constructor(props: any) {
    super(props);
    this.state = {
      visible: false,
      userExperienceImprovementPlan: false,
      userData: {},
    };
    this.loadCount = 0;
  }

  componentDidMount() {
    //this.loadSystemInfo();
  }

  loadSystemInfo = () => {
    loadSystemInfo().then((re: SystemInfo) => {
      if (re) {
        this.setState({
          systemInfo: re,
          userData: {
            installID: re.installID,
            version: re.systemVersion?.velaVersion,
            installTime: re.createTime,
          },
        });

        if (re.enableCollection) {
          this.loadCount = 0;
          this.sendUserData();
        }
      }
    });
  };

  openVersionDialog = () => {
    this.setState({
      visible: true,
    });
  };

  sendUserData = async () => {
    if (!getData('sendUserData')) {
      const { userData } = this.state;
      if (!userData || this.loadCount == 0) {
        this.loadAppCount();
        this.loadClusterCount();
        this.loadEnableAddonList();
      }
      if (this.loadCount == 3) {
        try {
          axios
            .post('https://user.kubevela.net/collecting', this.state.userData)
            .catch()
            .then(() => {
              this.setCache();
            });
        } catch {}
      }
    }
  };

  loadAppCount = async () => {
    getApplicationList({}).then((re) => {
      this.loadCount = this.loadCount + 1;
      if (re && Array.isArray(re.applications)) {
        const { userData } = this.state;
        userData.appCount = re.applications.length;
        this.setState({ userData: userData }, () => {
          this.sendUserData();
        });
      }
    });
  };

  loadClusterCount = async () => {
    getClusterList({}).then((re) => {
      this.loadCount = this.loadCount + 1;
      if (re) {
        const { userData } = this.state;
        userData.clusterCount = re.total;
        this.setState({ userData: userData }, () => {
          this.sendUserData();
        });
      }
    });
  };

  loadEnableAddonList = async () => {
    getEnabledAddons({}).then((re) => {
      this.loadCount = this.loadCount + 1;
      if (re) {
        const { userData } = this.state;
        userData.enableAddList = re.enabledAddons;
        this.setState({ userData: userData }, () => {
          this.sendUserData();
        });
      }
    });
  };

  setCache = () => {
    const now = new Date();
    now.setHours(now.getHours() + 24);
    setData('sendUserData', 'true', now);
  };

  closeVersionDialog = () => {
    this.setState({
      visible: false,
    });
  };

  showUserExperienceImprovementPlan = () => {
    this.setState({
      userExperienceImprovementPlan: true,
    });
  };

  disable = (status: boolean) => {
    updateSystemInfo({
      enableCollection: status,
    }).then(() => {
      Message.success('update system config success');
      this.loadSystemInfo();
    });
  };

  render() {
    const { userExperienceImprovementPlan, systemInfo } = this.state;
    const { Row, Col } = Grid;
    return (
      <div className="layout-topbar" id="layout-topbar">
        <Row className="nav-wraper">
          <Col span="4" className="logo">
            <img src={logo} title={'Make shipping applications more enjoyable.'} />
          </Col>
          <div style={{ flex: '1 1 0%' }} />
          <div className="right">
            <div className="vela-item">
              <SwitchLanguage />
            </div>
            <div className="vela-item">
              <a title="KubeVela Documents" href="https://kubevela.io" target="_blank">
                <Icon size={14} type="help1" />
              </a>
            </div>
            {/* <div className="vela-item">
              <Icon
                onClick={this.showUserExperienceImprovementPlan}
                size={14}
                type="exclamation-circle"
              />
            </div> */}
          </div>
        </Row>
        <Dialog
          title={<Translation>User Experience Improvement Plan</Translation>}
          visible={userExperienceImprovementPlan}
          className="commonDialog"
          style={{ width: '400px', minHeight: '100px' }}
          footer={() => {
            return <div />;
          }}
          onClose={() => {
            this.setState({ userExperienceImprovementPlan: false });
          }}
          locale={locale.Dialog}
        >
          <p>
            <Translation>For details on the user experience plan, please refer to</Translation>:
          </p>
          <a target="_blank" href="https://kubevela.io/docs/reference/user-improvement-plan">
            https://kubevela.io/docs/reference/user-improvement-plan
          </a>
          <div className="user-actions">
            <Button
              text={true}
              onClick={() => this.disable(systemInfo?.enableCollection ? false : true)}
            >
              <If condition={systemInfo?.enableCollection}>I don't join</If>
              <If condition={!systemInfo?.enableCollection}>Join it</If>
            </Button>
          </div>
        </Dialog>
      </div>
    );
  }
}

export default withTranslation()(TopBar);
