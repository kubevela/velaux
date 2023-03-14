import { connect } from 'dva';
import { Link } from 'dva/router';
import _ from 'lodash';
import React from 'react';
import Translation from '../../components/Translation';
import type { SystemInfo } from '../../interface/system';
import type { LoginUserInfo } from '../../interface/user';
import { menuService } from '../../services/MenuService';

import './index.less';
interface Props {
  userInfo?: LoginUserInfo;
  systemInfo?: SystemInfo;
}

const LeftMenu = (props: Props) => {
  if (!props.userInfo) {
    return <div />;
  }
  const workspace = menuService.loadCurrentWorkspace();
  const menus = workspace ? menuService.loadMenus(workspace, props.userInfo) : [];
  const childrenSlider = menus.map((item) => {
    const ele: JSX.Element[] = [];
    if (item.menus && item.menus.length > 0) {
      item.menus.map((childrenItem) => {
        const childrenArr = (
          <li className="nav-item" key={childrenItem.label}>
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
)(LeftMenu);
