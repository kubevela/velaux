import React from 'react';
import './index.less';
import { ILogin } from '../../model/login';
import { IResponse, Login } from '../../api/api';
import { Button, Message } from '@b-design/ui';
import Translation  from '../../components/translation';
import SwitchLanguage from "../../components/switch-button/index";
import { withTranslation } from "react-i18next";


class HomeCom extends React.Component {
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

    return (
      <>
        <div className='home-wraper'>
          <div className='nav-wraper'>
            <div className='nav-right-wraper'>
              <SwitchLanguage></SwitchLanguage>
            </div>
            <div className='nav-right-wraper'>
              <Button onClick={() => this.handleLogin({ username: 'admin', password: '123456' })} > <Translation>Log in</Translation></Button>
            </div>
          </div>
          <div className='content-wraper'>
            This is home pages
          </div>
        </div>
      </>
    )
  }
}

const Home = withTranslation()(HomeCom);
export default Home;