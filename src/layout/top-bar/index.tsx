import React, { Component } from 'react';
import './index.less';
import { ILogin } from '../../model/login';
import { IResponse, Login } from '../../api/api';
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

  componentDidMount = async () => {};

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

  handleLogin = async (login: ILogin) => {
    const res: IResponse = await Login(login);
    if (res.data.code === 200) {
      // this.props.history.push('/login', { data: res.data });
      Message.success(res.msg);
    } else {
      Message.error(res.msg);
    }
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
