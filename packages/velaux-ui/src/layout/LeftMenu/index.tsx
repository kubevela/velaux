import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { useEffect, useState } from 'react';
import { locationService } from '../../services/LocationService';
import { Translation } from '../../components/Translation';
import type { SystemInfo , LoginUserInfo } from '@velaux/data';
import { LeftMenu, menuService } from '../../services/MenuService';

import './index.less';
import { checkPermission } from '../../types';
import { getConfigs } from '../../api/config';
import { Config , MenuTypes, PluginMeta } from '@velaux/data';
import { MdOutlineMonitorHeart } from 'react-icons/md';
import { If } from '../../components/If';

interface Props {
  userInfo?: LoginUserInfo;
  systemInfo?: SystemInfo;
  pluginList: PluginMeta[];
}

const LeftMenuModule = (props: Props) => {
  const path = locationService.getPathName();
  const [menus, setMenus] = useState<LeftMenu[]>();
  const [grafanaConfigs, setGrafanaConfigs] = useState<Config[]>();
  useEffect(() => {
    if (checkPermission({ resource: 'config', action: 'list' }, '', props.userInfo)) {
      getConfigs('grafana').then((res) => {
        if (res) {
          setGrafanaConfigs(res.configs || []);
        }
      });
    }
  }, [props.userInfo]);

  useEffect(() => {
    menuService.resetPluginMenus()
    menuService.loadPluginMenus().then(() => {
      const workspace = menuService.loadCurrentWorkspace();
      const menus = workspace && props.userInfo ? menuService.loadMenus(workspace, props.userInfo) : [];
      if (grafanaConfigs && workspace?.name === 'extension') {
        const grafanaLeftMenu: LeftMenu = { catalog: 'Grafana', menus: [] };
        grafanaConfigs.map((g) => {
          if (g.properties && g.properties['endpoint']) {
            grafanaLeftMenu.menus.push({
              name: g.name,
              workspace: 'extension',
              label: g.alias || g.name,
              to: '',
              href: g.properties['endpoint'],
              relatedRoute: [],
              type: MenuTypes.Workspace,
              icon: <MdOutlineMonitorHeart></MdOutlineMonitorHeart>,
            });
          }
        });
        menus.push(grafanaLeftMenu);
      }
      setMenus(menus);
    });
  }, [props.userInfo, path, grafanaConfigs, props.pluginList]);

  if (!props.userInfo) {
    return <div />;
  }

  let fallBackCatalog = 0;
  const childrenSlider = menus?.map((item) => {
    const ele: JSX.Element[] = [];
    if (item.menus && item.menus.length > 0) {
      item.menus.map((childrenItem) => {
        const item = (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {childrenItem.icon}
            <span className={'menu-item-text'}>
              <Translation>{childrenItem.label}</Translation>
            </span>
          </div>
        );
        const childrenArr = (
          <li className="nav-item" key={childrenItem.name}>
            <If condition={childrenItem.href}>
              <a
                rel="noopener noreferrer"
                target="_blank"
                className={childrenItem.active ? 'menu-item-active' : 'menu-item'}
                href={childrenItem.href}
              >
                {item}
              </a>
            </If>
            <If condition={childrenItem.to && !childrenItem.href}>
              <Link to={childrenItem.to} className={childrenItem.active ? 'menu-item-active' : 'menu-item'}>
                {item}
              </Link>
            </If>
          </li>
        );
        ele.push(childrenArr);
      });
    }
    if (ele.length > 0) {
      return (
        <li className="nav-container" key={item.catalog ? item.catalog : fallBackCatalog++}>
          {item.catalog && (
            <div className="main-nav padding-left-32">
              <Translation>{item.catalog}</Translation>
            </div>
          )}
          <ul className="sub-wrapper">{ele}</ul>
        </li>
      );
    }
    return null;
  });

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div className="slide-wrapper">
        <ul className="ul-wrapper">{childrenSlider}</ul>
      </div>
    </div>
  );
};

export default connect(
  (store: any) => {
    return { ...store.user, ...store.plugins };
  },
  undefined,
  undefined,
  { pure: false }
)(LeftMenuModule);
