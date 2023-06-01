import { Icon, Grid } from '@alifd/next';
import { Link } from 'dva/router';
import _ from 'lodash';
import React, { Component } from 'react';

import aliyunImg from '../../../../assets/aliyun.svg';
import awsImg from '../../../../assets/aws.svg';
import azureImg from '../../../../assets/azure.svg';
import defaultConfigSVG from '../../../../assets/config.svg';
import dockerImg from '../../../../assets/docker.svg';
import gitImg from '../../../../assets/git.svg';
import grafanaImg from '../../../../assets/grafana.svg';
import helmImg from '../../../../assets/helm.svg';
import nacosImg from '../../../../assets/nacos.svg';
import prometheusImg from '../../../../assets/prometheus.svg';
import ssoImg from '../../../../assets/sso.svg';
import terraformImg from '../../../../assets/terraform.svg';
import type { ConfigTemplate } from '@velaux/data';
import './index.less';

const imgDate = [
  {
    id: 'helm-repository',
    img: helmImg,
  },
  {
    id: 'image-registry',
    img: dockerImg,
  },
  {
    id: 'dex-connector',
    img: ssoImg,
  },
  {
    id: 'git',
    img: gitImg,
  },
  {
    id: 'alibaba',
    img: aliyunImg,
  },
  {
    id: 'aws',
    img: awsImg,
  },
  {
    id: 'azure',
    img: azureImg,
  },
  {
    id: 'terraform',
    img: terraformImg,
  },
  {
    id: 'nacos',
    img: nacosImg,
  },
  {
    id: 'grafana',
    img: grafanaImg,
  },
  {
    id: 'loki',
    img: grafanaImg,
  },
  {
    id: 'prometheus',
    img: prometheusImg,
  },
];

type Props = {
  activeName: string;
  menuData: ConfigTemplate[];
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
    return menuData.map((item: ConfigTemplate) => {
      const findMatchData: any = this.matchMenuData(item.name);
      if (findMatchData) {
        return Object.assign(item, { iconType: 'arrow-right', img: findMatchData.img });
      } else {
        return Object.assign(item, { iconType: 'arrow-right', img: defaultConfigSVG });
      }
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
          <Link to={`/configs/${item.name}/config`}>
            <Row className={`menu-item-wrapper ${isActive}`}>
              <Col span="5">
                <div className="menu-item-img-wrapper">
                  <img src={item.img} className="menu-item-img" />
                </div>
              </Col>
              <Col span="17">
                <div className="menu-item-description">{item.alias || item.name}</div>
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
