import React, { Component, Fragment } from 'react';
import { Icon } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import './index.less';

class ProjectMenu extends Component {
  getMenuList = () => {
    const menuProps = [
      { labe: '开发者', id: 'developer' },
      { labe: '运维', id: 'devops' },
      { labe: '观察者', id: 'watcher' },
      { labe: 'QA', id: 'qa' },
      { labe: '测试', id: 'tester' },
      { labe: '管理员', id: 'manager' },
    ];
    const menuList = menuProps.map((item) => {
      return (
        <li className="menu-item">
          <span> {item.labe} </span>
          <span>
            <Icon type="delete" />
          </span>
        </li>
      );
    });
    return menuList;
  };

  render() {
    return (
      <Fragment>
        <ul className="project-menu-wrapper">
          {this.getMenuList()}
          <li className="add-roles-btn">
            <Translation>新增角色</Translation>
          </li>
        </ul>
      </Fragment>
    );
  }
}

export default ProjectMenu;
