import React, { Component, Fragment } from 'react';
import { Icon, Message } from '@b-design/ui';
import type { ProjectRoleBase } from '../../../../interface/project';
import Translation from '../../../../components/Translation';
import './index.less';

type Props = {
  projectRoles: ProjectRoleBase[];
  isAddRole: boolean;
  isCreateProjectRoles: boolean;
  addRole: () => void;
  activeRoleName: string;
  handleChangeRole: (roleName: string) => void;
  onDeleteProjectRole: (roleName: string) => void;
};

class ProjectMenu extends Component<Props> {
  handleChangeRole = (name: string) => {
    const { isCreateProjectRoles } = this.props;
    if (!isCreateProjectRoles) {
      this.props.handleChangeRole(name);
    } else {
      return Message.warning(
        <Translation>
          When adding a project role, you cannot view the details of other project roles
        </Translation>,
      );
    }
  };

  handleClick(name: string, e: any) {
    e.preventDefault();
    this.props.onDeleteProjectRole(name);
  }

  getMenuList = () => {
    const { projectRoles, activeRoleName, isCreateProjectRoles } = this.props;
    const menuList = (projectRoles || []).map((item: { name: string; alias?: string }) => {
      const activeRole = activeRoleName === item.name && !isCreateProjectRoles ? 'active' : '';
      return (
        <li
          className={`menu-role-item ${activeRole}`}
          onClick={() => {
            this.handleChangeRole(item.name);
          }}
        >
          <span> {item.alias || item.name} </span>
          <span>
            <Icon
              type="delete"
              onClick={(e) => {
                this.handleClick(item.name, e);
              }}
            />
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
          <li className="add-roles-btn" onClick={this.props.addRole}>
            <Translation>New Role</Translation>
          </li>
        </ul>
      </Fragment>
    );
  }
}

export default ProjectMenu;
