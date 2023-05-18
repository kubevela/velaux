import { Message } from '@alifd/next';
import React, { Component, Fragment } from 'react';
import { AiOutlineDelete } from 'react-icons/ai';

import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import type { ProjectRoleBase } from '@velaux/data';
import './index.less';

type Props = {
  projectRoles: ProjectRoleBase[];
  isAddRole: boolean;
  isCreateProjectRoles: boolean;
  addRole: () => void;
  activeRoleName: string;
  projectName: string;
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
        <Translation>When adding a project role, you cannot view the details of other project roles</Translation>
      );
    }
  };

  handleClick(name: string, e: any) {
    e.preventDefault();
    this.props.onDeleteProjectRole(name);
  }

  getMenuList = () => {
    const { projectRoles, activeRoleName, isCreateProjectRoles, projectName } = this.props;
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
          <Permission
            request={{ resource: `project:${projectName}/role:${item.name}`, action: 'delete' }}
            project={projectName}
          >
            <span>
              <AiOutlineDelete
                onClick={(e) => {
                  this.handleClick(item.name, e);
                }}
              />
            </span>
          </Permission>
        </li>
      );
    });
    return menuList;
  };

  render() {
    const { projectName } = this.props;
    return (
      <Fragment>
        <ul className="project-menu-wrapper">
          {this.getMenuList()}
          <Permission request={{ resource: `project:${projectName}/role:*`, action: 'create' }} project={projectName}>
            <li className="add-roles-btn" onClick={this.props.addRole}>
              <Translation>New Role</Translation>
            </li>
          </Permission>
        </ul>
      </Fragment>
    );
  }
}

export default ProjectMenu;
