import React, { Component } from 'react';
import './index.less';
import { Grid } from '@b-design/ui';
import SwitchLanguage from '../../components/SwitchButton/index';
import { withTranslation } from 'react-i18next';

import logo from '../../assets/kubevela-log.png';

type Props = {
  t: (key: string) => {};
};

class TopBar extends Component<Props> {
  constructor(props: any) {
    super(props);
    this.state = {
      newVersionData: {},
      showUpdate: false,
      visible: false,
      uncompress: false,
      finish: false,
    };
  }
  openVersionDialog = () => {
    this.setState({
      visible: true,
    });
  };

  closeVersionDialog = () => {
    this.setState({
      visible: false,
    });
  };

  render() {
    const { Row, Col } = Grid;
    return (
      <div className="layout-topbar" id="layout-topbar">
        <Row className="nav-wraper">
          <Col span="4">
            <img src={logo} className="logo" />
            <span className="text">KubeVela</span>
          </Col>
          <div className="language-switch-container">
            <SwitchLanguage />
          </div>
        </Row>
      </div>
    );
  }
}

export default withTranslation()(TopBar);
