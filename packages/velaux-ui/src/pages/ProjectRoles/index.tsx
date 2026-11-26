import { Button, Dialog, Message, Table } from '@alifd/next';
import React, { Component, Fragment } from 'react';
import { AiOutlineDelete, AiOutlineEdit } from 'react-icons/ai';

import {
  createProjectRoles,
  deleteProjectRoles,
  getProjectPermissions,
  getProjectRoles,
  updateProjectRoles,
} from '../../api/project';
import { AliasName } from '../../components/AliasName';
import Permission from '../../components/Permission';
import RoleDialog from '../../components/RoleDialog';
import type { RoleValues } from '../../components/RoleDialog';
import { RoleAccessChips } from '../../components/RolePermissions';
import { RowAction } from '../../components/RowAction';
import { Translation } from '../../components/Translation';
import type { ProjectRoleBase, PermissionBase } from '@velaux/data';
import { momentDate } from '../../utils/common';
import { locale } from '../../utils/locale';

import './index.less';

type Props = {
  match: {
    params: {
      projectName: string;
    };
  };
};

type State = {
  roles: ProjectRoleBase[];
  permissions: PermissionBase[];
  isLoading: boolean;
  visible: boolean;
  editRole?: ProjectRoleBase;
};

// ProjectRoles is a project's Roles tab: its roles, what each may do, and the dialog to create or edit one.
class ProjectRoles extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { roles: [], permissions: [], isLoading: false, visible: false };
  }

  componentDidMount() {
    this.listRoles();
    getProjectPermissions({ projectName: this.projectName() }).then((res) => {
      this.setState({ permissions: res || [] });
    });
  }

  projectName = () => this.props.match.params.projectName || '';

  listRoles = () => {
    this.setState({ isLoading: true });
    getProjectRoles({ projectName: this.projectName() })
      .then((res) => {
        this.setState({ roles: (res && res.roles) || [] });
      })
      .finally(() => {
        this.setState({ isLoading: false });
      });
  };

  saveRole = (values: RoleValues, isEdit: boolean) => {
    const projectName = this.projectName();
    return isEdit
      ? updateProjectRoles({ projectName, roleName: values.name }, values)
      : createProjectRoles({ projectName }, values);
  };

  onSaved = () => {
    this.setState({ visible: false, editRole: undefined });
    this.listRoles();
  };

  onDelete = (roleName: string) => {
    Dialog.confirm({
      content: 'Are you sure you want to delete this role',
      onOk: () => {
        deleteProjectRoles({ projectName: this.projectName(), roleName }).then((res) => {
          if (res) {
            Message.success(<Translation>Delete the role success</Translation>);
            this.listRoles();
          }
        });
      },
      locale: locale().Dialog,
    });
  };

  render() {
    const projectName = this.projectName();
    const { roles, permissions, isLoading, visible, editRole } = this.state;
    const { Column } = Table;
    return (
      <div className="project-roles">
        <section className="project-roles-create">
          <Permission request={{ resource: `project:${projectName}/role:*`, action: 'create' }} project={projectName}>
            <Button type="primary" onClick={() => this.setState({ visible: true, editRole: undefined })}>
              <Translation>New Role</Translation>
            </Button>
          </Permission>
        </section>
        <Table locale={locale().Table} dataSource={roles} loading={isLoading}>
          <Column
            title={<Translation>Name</Translation>}
            dataIndex="name"
            width={220}
            cell={(v: string, i: number, record: ProjectRoleBase) => <AliasName name={v} alias={record.alias} />}
          />
          <Column
            title={<Translation>Permissions</Translation>}
            dataIndex="permissions"
            cell={(v: ProjectRoleBase['permissions']) => <RoleAccessChips granted={v} permissions={permissions} />}
          />
          <Column
            title={<Translation>CreateTime</Translation>}
            dataIndex="createTime"
            width={200}
            cell={(v: string) => (v ? momentDate(v) : '')}
          />
          <Column
            title={<Translation>Actions</Translation>}
            dataIndex="name"
            width={120}
            cell={(v: string, i: number, record: ProjectRoleBase) => (
              <Fragment>
                <Permission
                  request={{ resource: `project:${projectName}/role:${v}`, action: 'update' }}
                  project={projectName}
                >
                  <RowAction
                    icon={<AiOutlineEdit />}
                    label="Edit"
                    onClick={() => this.setState({ visible: true, editRole: record })}
                  />
                </Permission>
                <Permission
                  request={{ resource: `project:${projectName}/role:${v}`, action: 'delete' }}
                  project={projectName}
                >
                  <RowAction icon={<AiOutlineDelete />} label="Delete" danger onClick={() => this.onDelete(v)} />
                </Permission>
              </Fragment>
            )}
          />
        </Table>
        {visible && (
          <RoleDialog
            role={editRole}
            permissions={permissions}
            save={this.saveRole}
            onSaved={this.onSaved}
            onClose={() => this.setState({ visible: false, editRole: undefined })}
          />
        )}
      </div>
    );
  }
}

export default ProjectRoles;
