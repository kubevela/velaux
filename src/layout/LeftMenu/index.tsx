import React from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import _ from 'lodash';
import { Balloon, Icon } from '@b-design/ui';
import { getLeftSlider } from './menu';
import type { LoginUserInfo } from '../../interface/user';
import type { SystemInfo } from '../../interface/system';
import Translation from '../../components/Translation';
import { version } from '../../../package.json';
import { checkPermission } from '../../utils/permission';
import './index.less';

interface Props {
  userInfo?: LoginUserInfo;
  systemInfo?: SystemInfo;
  history: {
    location: {
      pathname: string;
    };
  };
}

const LeftMenu = (props: Props) => {
  if (!props.userInfo) {
    return <div />;
  }
  const pathname = _.get(props.history.location, 'pathname');
  const sliders = getLeftSlider(pathname);
  const childrenSlider = sliders.map((item) => {
    const ele: any = [];
    if (item.children) {
      item.children.map((childrenItem) => {
        if (checkPermission(childrenItem.permission, '?', props.userInfo)) {
          const childrenArr = (
            <li className="nav-item" key={childrenItem.navName}>
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
          ele.push(childrenArr);
        }
        return;
      });
    }
    if (ele.length > 0) {
      return (
        <li className="nav-container" key={item.navName}>
          <div className="main-nav padding-left-32">
            <Translation>{item.navName}</Translation>
          </div>
          <ul className="sub-wrapper">{ele}</ul>
        </li>
      );
    }
    return null;
  });

  const releaseVersion = process.env.VERSION || version;

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div className="slide-wrapper">
        <ul className="ul-wrapper">{childrenSlider}</ul>
        <div className="bottom">
          <Balloon
            align="t"
            trigger={
              <div className="nav-container">
                {releaseVersion}-{__COMMIT_HASH__}
              </div>
            }
          >
            <p>API Server Version: {props.systemInfo?.systemVersion?.velaVersion}</p>
            <p>API Server GitCommit: {props.systemInfo?.systemVersion?.gitVersion}</p>
          </Balloon>
        </div>
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
  { pure: false },
)(LeftMenu);
