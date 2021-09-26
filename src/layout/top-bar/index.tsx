import React, { Component } from "react";
import './index.less';
import { ILogin } from '../../model/login';
import { IResponse, Login } from '../../api/api';
import { Button, Message, Grid, Search, Icon } from '@b-design/ui';
import Translation from '../../components/translation';
import SwitchLanguage from "../../components/switch-button/index";
import { withTranslation } from "react-i18next";
// const logo = require('../../assets/kubevelaLog.png');
import logo from '../../assets/kubevelaLog.png';


class TopBar extends Component {
    constructor(props: any) {
        super(props);
        this.state = {
            newVersionData: {},
            showUpdate: false,
            visible: false,
            uncompress: false,
            finish: false
        }

    }

    componentDidMount = async () => {

    }

    openVersionDialog = () => {
        this.setState({
            visible: true
        })
    }

    closeVersionDialog = () => {
        this.setState({
            visible: false
        })
    }

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
        return <div className="layout-topbar" id="layout-topbar">
            <Row className='nav-wraper'>
                <Col span='4'>
                    <img src={logo} className='logo' />
                    <span className='text'>Kubevala</span>
                </Col>
                <Col span='18'>
                    <Search key="12312" size='medium' shape='simple' onSearch={() => { }} className='search' />
                </Col>
                <Col span='1'>
                    <Icon type="atm" className='atm' />
                </Col>
                <Col span='1'>
                    <Icon type="set" className='set' />
                </Col>
            </Row>
        </div>

    }
}

export default withTranslation()(TopBar);


