import { connect } from 'dva';
import { Link } from 'dva/router';
import { Balloon } from '@alifd/next';
import React, { useEffect, useState } from 'react';
import { locationService } from '../../services/LocationService';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import type { SystemInfo, LoginUserInfo } from '@velaux/data';
import { LeftMenu, menuService } from '../../services/MenuService';

import './index.less';
import { checkPermission } from '../../types';
import { getConfigs } from '../../api/config';
import { Config, MenuTypes, PluginMeta } from '@velaux/data';
import { MdOutlineMonitorHeart } from 'react-icons/md';

interface Props {
  userInfo?: LoginUserInfo;
  systemInfo?: SystemInfo;
  pluginList: PluginMeta[];
  // collapsed is whether the sidebar shows icons only, so names show on hover.
  collapsed?: boolean;
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
    menuService.resetPluginMenus();
    menuService.loadPluginMenus().then(() => {
      const menus = props.userInfo ? menuService.loadSidebarMenus(props.userInfo) : [];
      if (grafanaConfigs && grafanaConfigs.length > 0) {
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
        if (grafanaLeftMenu.menus.length > 0) {
          menus.push(grafanaLeftMenu);
        }
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
        // hint names a collapsed item, and says when one is not available yet.
        const hint = (props.collapsed || childrenItem.comingSoon) && (
          <div className="menu-item-hint">
            {props.collapsed && (
              <div className="menu-item-hint-name">
                <Translation>{childrenItem.label}</Translation>
              </div>
            )}
            {childrenItem.comingSoon && (
              <div className="menu-item-hint-soon">
                <Translation>Coming Soon</Translation>
              </div>
            )}
          </div>
        );
        const withHint = (trigger: JSX.Element) =>
          hint ? (
            <Balloon.Tooltip align="r" trigger={trigger}>
              {hint}
            </Balloon.Tooltip>
          ) : (
            trigger
          );
        if (childrenItem.comingSoon) {
          ele.push(
            <li className="nav-item" key={childrenItem.name}>
              {withHint(
                <span className="menu-item menu-item-coming-soon" aria-disabled="true">
                  {item}
                </span>
              )}
            </li>
          );
          return;
        }
        // The tooltip names a collapsed item, so the browser's title is only
        // given when it is not shown.
        const title = hint ? undefined : i18n.t(childrenItem.label).toString();
        ele.push(
          <li className="nav-item" key={childrenItem.name}>
            {childrenItem.href &&
              withHint(
                <a
                  rel="noopener noreferrer"
                  target="_blank"
                  className={childrenItem.active ? 'menu-item-active' : 'menu-item'}
                  href={childrenItem.href}
                  title={title}
                >
                  {item}
                </a>
              )}
            {childrenItem.to &&
              !childrenItem.href &&
              withHint(
                <Link
                  to={childrenItem.to}
                  className={childrenItem.active ? 'menu-item-active' : 'menu-item'}
                  title={title}
                >
                  {item}
                </Link>
              )}
          </li>
        );
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
