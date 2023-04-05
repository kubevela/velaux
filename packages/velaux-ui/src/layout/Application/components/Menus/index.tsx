import { Card } from '@alifd/next';
import React, { Component } from 'react';

import { Translation } from '../../../../components/Translation';

import './index.less';
import { Link } from 'dva/router';

import { locale } from '../../../../utils/locale';

type Props = {
  envName: string;
  appName: string;
  currentPath: string;
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
    const { envName, appName, currentPath } = this.props;
    const isEnvPage = envName != undefined;
    const menuItems = {
      configPage: [
        {
          key: 'config',
          label: <Translation>Properties</Translation>,
          to: `/applications/${appName}/config`,
        },
        {
          key: 'revisions',
          label: <Translation>Revisions</Translation>,
          to: `/applications/${appName}/revisions`,
        },
        {
          key: 'workflows',
          label: <Translation>Workflows</Translation>,
          to: `/applications/${appName}/workflows`,
        },
      ],
      envPage: [
        {
          key: 'workflow',
          label: <Translation>Workflow</Translation>,
          to: `/applications/${appName}/envbinding/${envName}/workflow`,
        },
        {
          key: 'status',
          label: <Translation>Status</Translation>,
          to: `/applications/${appName}/envbinding/${envName}/status`,
        },
        {
          key: 'instances',
          label: <Translation>Instances</Translation>,
          to: `/applications/${appName}/envbinding/${envName}/instances`,
        },
        {
          key: 'logs',
          label: <Translation>Logs</Translation>,
          to: `/applications/${appName}/envbinding/${envName}/logs`,
        },
      ],
    };
    let activeItems = menuItems.configPage;
    if (isEnvPage) {
      activeItems = menuItems.envPage;
    }
    const activeKey = currentPath.substring(currentPath.lastIndexOf('/') + 1);

    return (
      <Card locale={locale().Card} contentHeight="100px" className="app-menu">
        {activeItems.map((item) => {
          return (
            <Link
              key={item.key}
              to={item.to}
              className={item.key === activeKey || currentPath.startsWith(item.to) ? 'menu-item-active' : 'menu-item'}
            >
              {item.label}
            </Link>
          );
        })}
      </Card>
    );
  }
}

export default Menu;
