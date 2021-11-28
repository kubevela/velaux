import { Card } from '@b-design/ui';
import React, { Component } from 'react';
import Translation from '../../../../components/Translation';
import './index.less';
import { Link } from 'dva/router';

type Props = {
  envName: string;
  appName: string;
  currentPath: string;
  applicationType?: 'cloud' | 'common';
};

class Menu extends Component<Props, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      loading: true,
    };
  }

  componentDidMount() {}

  render() {
    const { envName, appName, currentPath, applicationType } = this.props;
    const isEnvPage = envName != undefined;
    const menuItems = {
      configPage: [
        {
          key: 'config',
          lable: <Translation>Properties&Traits</Translation>,
          to: `/applications/${appName}/config`,
        },
        {
          key: 'workflows',
          lable: <Translation>Workflows</Translation>,
          to: `/applications/${appName}/workflows`,
        },
        {
          key: 'revisions',
          lable: <Translation>Revisions</Translation>,
          to: `/applications/${appName}/revisions`,
        },
      ],
      envPage: [
        {
          key: 'instances',
          lable: <Translation>Instances</Translation>,
          to: `/applications/${appName}/envbinding/${envName}/instances`,
        },
      ],
    };
    if (applicationType == 'common') {
      menuItems.envPage.push({
        key: 'monitor',
        lable: <Translation>Monitor</Translation>,
        to: `/applications/${appName}/envbinding/${envName}/monitor`,
      });
    }
    let activeItems = menuItems.configPage;
    if (isEnvPage) {
      activeItems = menuItems.envPage;
    }
    const activeKey = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    return (
      <Card contentHeight="100px" className="app-menu">
        {activeItems.map((item) => {
          return (
            <Link
              key={item.key}
              to={item.to}
              className={item.key === activeKey ? 'menu-item-active' : 'menu-item'}
            >
              {item.lable}
            </Link>
          );
        })}
      </Card>
    );
  }
}

export default Menu;
