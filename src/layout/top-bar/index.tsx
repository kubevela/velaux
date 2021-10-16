import React, { Component } from 'react';
import './index.less';
import { Button, Message, Grid, Search, Icon } from '@b-design/ui';
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
    const { t } = this.props;
    return (
      <div className="layout-topbar" id="layout-topbar">
        <Row className="nav-wraper">
          <Col span="4">
            <img src={logo} className="logo" />
            <span className="text">Kubevala</span>
          </Col>
          <Col span="16">
            <Search
              key="12312"
              size="medium"
              shape="simple"
              onSearch={() => {}}
              className="search"
              placeholder={t('Please enter').toString()}
            />
          </Col>

          <Col span="1">
            <Icon type="atm" className="atm" />
          </Col>
          <Col span="1">
            <Icon type="set" className="set" />
          </Col>
          <Col span="2">
            <div className="margin-top-10 margin-left-10">
              <SwitchLanguage></SwitchLanguage>
            </div>
          </Col>
        </Row>
      </div>
    );
  }
}

export default withTranslation()(TopBar);
