import React from 'react';
import _ from 'lodash';
import { Link } from 'dva/router';
import { Icon } from '@b-design/ui';
import Translation from '../../components/Translation';
import { getLeftSider } from './menu';
import './index.less';

const LeftMenu = (props: any) => {
  const pathname = _.get(props, 'props.history.location.pathname');
  const sider = getLeftSider(pathname);
  const childrenSider = sider.map((item) => {
    let ele = [];
    if (item.children) {
      const childrenArr = item.children.map((childrenItem) => {
        return (
          <li className="nav-item">
            <Link
              to={childrenItem.link}
              className={childrenItem.className ? 'menu-item-active' : 'menu-item'}
            >
              <div>
                <Icon type={childrenItem.iconType} />
                <span className={'menu-item-text'}>
                  <Translation>{childrenItem.navName}</Translation>
                </span>
              </div>
            </Link>
          </li>
        );
      });
      ele.push(childrenArr);
    }
    return (
      <li className="nav-container" key={item.navName}>
        <div className="main-nav padding-left-32">
          <Translation>{item.navName}</Translation>
        </div>
        {ele.length > 0 ? <ul className="subnav-wrapper">{ele}</ul> : null}
      </li>
    );
  });

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div className="slide-wraper">
        <ul className="ul-wraper">{childrenSider}</ul>
      </div>
    </div>
  );
};

export default LeftMenu;
