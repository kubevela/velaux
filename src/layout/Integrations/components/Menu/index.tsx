import React, { Component } from 'react';
import { Icon, Grid } from '@b-design/ui';
import { Link } from 'dva/router';
import { IntegrationBase, IntegrationBaseExtends } from '../../../../interface/integrations';
import defaultIntegrationSVG from '../../../../assets/integration.svg';
import helmImg from '../../../../assets/helm.png';
import dockerImg from '../../../../assets/docker.png';
import gitImg from '../../../../assets/git.png';
import ssoImg from '../../../../assets/sso.png';
import terraformImg from '../../../../assets/terraform.png';
import _ from 'lodash';
import './index.less';

const imgDate = [
  {
    id: 'config-helm-repository',
    img: helmImg,
  },
  {
    id: 'config-image-registry',
    img: dockerImg,
  },
  {
    id: 'terraform-provider',
    img: terraformImg,
  },
  {
    id: 'config-dex-connector',
    img: ssoImg,
  },
  {
    id: 'git',
    img: gitImg,
  },
];

type Props = {
  activeName: string;
  menuData: IntegrationBase[];
};
type State = {};

class Menu extends Component<Props, State> {
  matchMenuData = (name: string) => {
    return _.find(imgDate, (item: { id: string; img: string }) => {
      if (name.indexOf(item.id) != -1) {
        return item;
      } else {
        return null;
      }
    });
  };

  transMenuData = () => {
    const { menuData } = this.props;
    return (menuData || []).map((item: IntegrationBaseExtends) => {
      const findMatchData: any = this.matchMenuData(item.name);
      if (findMatchData) {
        item.iconType = 'arrow-right';
        item.img = findMatchData.img;
      } else {
        item.iconType = 'arrow-right';
        item.img = defaultIntegrationSVG;
      }
      return item;
    });
  };

  getMenuItem = () => {
    const { Row, Col } = Grid;
    const { activeName } = this.props;
    const transMenuData = this.transMenuData();
    const result = (transMenuData || []).map((item) => {
      const isActive = activeName === item.name ? 'active-menu-item' : '';
      return (
        <li key={item.name}>
          <Link to={`/integrations/${item.name}/config`}>
            <Row className={`menu-item-wrapper ${isActive}`}>
              <Col span="5">
                <div className="menu-item-img-wrapper">
                  <img src={item.img} className="menu-item-img" />
                </div>
              </Col>
              <Col span="17">
                <div className="menu-item-description">{item.name}</div>
              </Col>
              <Col span="2">
                <div className="menu-item-icon">
                  <Icon type={item.iconType} />
                </div>
              </Col>
            </Row>
          </Link>
        </li>
      );
    });
    return result;
  };

  render() {
    const menuItem = this.getMenuItem();
    return (
      <div className="menu-content">
        <ul>{menuItem}</ul>
      </div>
    );
  }
}

export default Menu;
