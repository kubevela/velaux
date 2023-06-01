import { Grid, Dialog, Message } from '@alifd/next';
import React, { Component } from 'react';

import { getProjectRoles, getProjectPermissions, deleteProjectRoles } from '../../api/project';
import { If } from '../../components/If';
import { Translation } from '../../components/Translation';
import type { ProjectRoleBase , PermissionBase } from '@velaux/data';
import { locale } from '../../utils/locale';

import ProjectMenu from './components/Menu';
import ProjectPermPoliciesDetail from './components/ProjectPermPoliciesDetail';

import './index.less';

type Props = {
  match: {
    params: {
      projectName: string;
    };
  };
};
type State = {
  projectName: string;
  projectRoles: ProjectRoleBase[];
  projectPermissions: PermissionBase[];
  isLoading: boolean;
  isAddRole: false;
  activeRoleName: string;
  activeRoleItem: ProjectRoleBase;
  isCreateProjectRoles: boolean;
};

class ProjectRoles extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      projectName: this.getProjectName(),
      projectRoles: [],
      projectPermissions: [],
      activeRoleName: '',
      isLoading: false,
      isAddRole: false,
      activeRoleItem: { name: '' },
      isCreateProjectRoles: false,
    };
  }

  componentDidMount() {
    this.listProjectRoles();
    this.listProjectPermPolicies();
  }

  listProjectRoles = async () => {
    const { projectName } = this.state;
    const params = {
      projectName,
    };
    this.setState({ isLoading: true });
    getProjectRoles(params)
      .then((res) => {
        this.setState({
          projectRoles: (res && res.roles) || [],
        });
      })
      .finally(() => {
        this.setState({
          isLoading: false,
        });
      });
  };

  listProjectPermPolicies = async () => {
    const { projectName } = this.state;
    const param = { projectName };
    getProjectPermissions(param).then((res) => {
      this.setState({
        projectPermissions: (res && res) || [],
      });
    });
  };

  getProjectName = () => {
    const { params = { projectName: '' } } = this.props.match;
    return params.projectName || '';
  };

  getActiveRoleName = () => {
    const { activeRoleName, projectRoles = [] } = this.state;
    if (!activeRoleName && projectRoles.length != 0) {
      return projectRoles[0] && projectRoles[0].name;
    } else {
      return activeRoleName || '';
    }
  };

  getActiveRoleItem = () => {
    const { activeRoleItem, projectRoles = [] } = this.state;
    if (!activeRoleItem.name && projectRoles.length != 0) {
      return projectRoles[0];
    } else {
      return activeRoleItem || [];
    }
  };

  addRole = () => {
    this.setState({
      isCreateProjectRoles: true,
    });
  };

  handleChangeRole = (roleName: string) => {
    this.setState(
      {
        activeRoleName: roleName,
      },
      () => {
        const activeRoleItem = this.findActiveRoleItem();
        this.setState({
          activeRoleItem: activeRoleItem || { name: '' },
        });
      }
    );
  };

  findActiveRoleItem = () => {
    const { projectRoles, activeRoleName } = this.state;
    return (projectRoles || [{ name: '' }]).find((item: { name: string }) => item.name === activeRoleName);
  };

  onCreate = (activeRoleName: string) => {
    this.setState({
      isCreateProjectRoles: false,
      activeRoleName,
    });
    this.listProjectRoles();
  };

  onDeleteProjectRole = (roleName: string) => {
    const { projectName } = this.state;
    Dialog.confirm({
      content: 'Are you sure you want to delete this role',
      onOk: () => {
        if (roleName) {
          deleteProjectRoles({ projectName, roleName }).then((res) => {
            if (res) {
              Message.success(<Translation>Delete the role success</Translation>);
              this.listProjectRoles();
            }
          });
        }
      },
      locale: locale().Dialog,
    });
  };

  render() {
    const { Row, Col } = Grid;
    const { projectName, projectRoles, isAddRole, projectPermissions, isCreateProjectRoles } = this.state;
    return (
      <Row className="project-roles-wrapper">
        <Col span="6">
          <ProjectMenu
            isCreateProjectRoles={isCreateProjectRoles}
            isAddRole={isAddRole}
            activeRoleName={this.getActiveRoleName()}
            projectRoles={projectRoles}
            addRole={this.addRole}
            projectName={projectName}
            handleChangeRole={(roleName: string) => {
              this.handleChangeRole(roleName);
            }}
            onDeleteProjectRole={(roleName: string) => {
              this.onDeleteProjectRole(roleName);
            }}
          />
        </Col>

        <Col span="18" className="project-auth-border-left">
          <If condition={!isAddRole}>
            <ProjectPermPoliciesDetail
              projectRoles={projectRoles}
              projectName={projectName}
              isCreateProjectRoles={isCreateProjectRoles}
              activeRoleName={this.getActiveRoleName()}
              activeRoleItem={this.getActiveRoleItem()}
              projectPermissions={projectPermissions}
              onCreate={(activeRoleName: string) => {
                this.onCreate(activeRoleName);
              }}
            />
          </If>
        </Col>
      </Row>
    );
  }
}

export default ProjectRoles;
