import _ from 'loadsh';
import { Link } from 'dva/router';
import { Icon } from '@b-design/ui';
import Translation from '../../components/Translation';
import { getLeftSider } from './menu';
import './index.less';

const LeftMenu = (data, context) => {
  const pathname = _.get(data, 'props.history.location.pathname');
  const sider = getLeftSider(pathname);
  const childrenSider = sider.map((item) => {
    let ele = [];
    if (item.children) {
      const childrenArr = item.children.map((childrenItem) => {
        return (
          <ul>
            <li>
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
          </ul>
        );
      });
      ele.push(childrenArr);
    }
    return (
      <li className="first-nav" key={item.navName}>
        <div className="padding-left-20">
          <Translation>{item.navName}</Translation>
        </div>
        {ele}
      </li>
    );
  });

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div className="slide-wraper">
        <ul className="ul-wraper margin-top-5">{childrenSider}</ul>
      </div>
    </div>
  );
};

export default LeftMenu;
