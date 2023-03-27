import { connect } from 'dva';
import { Link } from 'dva/router';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { locationService } from '../../services/LocationService';
import Translation from '../../components/Translation';
import type { SystemInfo } from '../../interface/system';
import type { LoginUserInfo } from '../../interface/user';
import { menuService, LeftMenu } from '../../services/MenuService';

import './index.less';
interface Props {
  userInfo?: LoginUserInfo;
  systemInfo?: SystemInfo;
}

const LeftMenuModule = (props: Props) => {
  const path = locationService.getPathName();
  const [menus, setMenus] = useState<LeftMenu[]>();
  useEffect(() => {
    menuService.loadPluginMenus().then(() => {
      const workspace = menuService.loadCurrentWorkspace();
      const menus = workspace && props.userInfo ? menuService.loadMenus(workspace, props.userInfo) : [];
      setMenus(menus);
    });
  }, [props.userInfo, path]);

  if (!props.userInfo) {
    return <div />;
  }

  const childrenSlider = menus?.map((item) => {
    const ele: JSX.Element[] = [];
    if (item.menus && item.menus.length > 0) {
      item.menus.map((childrenItem) => {
        const childrenArr = (
          <li className="nav-item" key={childrenItem.name}>
            <Link to={childrenItem.to} className={childrenItem.active ? 'menu-item-active' : 'menu-item'}>
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
            </Link>
          </li>
        );
        ele.push(childrenArr);
      });
    }
    if (ele.length > 0) {
      return (
        <li className="nav-container" key={item.catalog}>
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
    return { ...store.user };
  },
  undefined,
  undefined,
  { pure: false }
)(LeftMenuModule);
