import { Button, Field, Form, Grid, Input, Message, Select } from '@alifd/next';
import React from 'react';
import { AiOutlineDelete, AiOutlinePlus } from 'react-icons/ai';
import { v4 as uuid } from 'uuid';

import { getGroupMappings, updateGroupMappings } from '../../api/group_mapping';
import { getProjectList, getProjectRoles } from '../../api/project';
import { ListTitle as Title } from '../../components/ListTitle';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import type { Project, ProjectRoleBase, GroupProjectRoleBase } from '@velaux/data';

const { Row, Col } = Grid;
const FormItem = Form.Item;

type Props = {};

type GroupItem = {
  id: string;
  group: string;
  project: string;
  role: string;
};

type State = {
  mappingItems: GroupItem[];
  projects: Project[];
  projectRoles: Record<string, ProjectRoleBase[]>;
  isLoading: boolean;
};

class GroupMappings extends React.Component<Props, State> {
  field: Field;

  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      mappingItems: [],
      projects: [],
      projectRoles: {},
      isLoading: false,
    };
  }

  componentDidMount() {
    this.listProjects();
    this.loadGroupMappings();
  }

  listProjects = async () => {
    try {
      const res = await getProjectList({ page: 0, pageSize: 0 });
      this.setState({ projects: res.projects || [] });
      // Pre-fetch roles for all projects to make the UI responsive
      if (res.projects) {
        res.projects.forEach((p: Project) => {
          this.loadProjectRoles(p.name);
        });
      }
    } catch (e) {
      // ignore
    }
  };

  loadProjectRoles = async (projectName: string) => {
    if (this.state.projectRoles[projectName]) {
      return;
    }
    try {
      const res = await getProjectRoles({ projectName });
      this.setState((prevState) => ({
        projectRoles: {
          ...prevState.projectRoles,
          [projectName]: res?.roles || [],
        },
      }));
    } catch (e) {
      // ignore
    }
  };

  loadGroupMappings = async () => {
    this.setState({ isLoading: true });
    try {
      const res = await getGroupMappings();
      const items: GroupItem[] = [];
      if (res && res.groups) {
        Object.keys(res.groups).forEach((group) => {
          res.groups[group].forEach((pr: GroupProjectRoleBase) => {
            items.push({
              id: uuid(),
              group: group,
              project: pr.project,
              role: pr.role,
            });
          });
        });
      }
      this.setState({ mappingItems: items, isLoading: false });
      
      // Initialize field values
      items.forEach((item) => {
        this.field.setValue(`${item.id}-group`, item.group);
        this.field.setValue(`${item.id}-project`, item.project);
        this.field.setValue(`${item.id}-role`, item.role);
      });
    } catch (e) {
      this.setState({ isLoading: false });
    }
  };

  onAddItem = () => {
    const newItem = { id: uuid(), group: '', project: '', role: '' };
    this.setState((prevState) => ({
      mappingItems: [...prevState.mappingItems, newItem],
    }));
  };

  onRemoveItem = (id: string) => {
    this.setState((prevState) => ({
      mappingItems: prevState.mappingItems.filter((item) => item.id !== id),
    }));
    this.field.remove(`${id}-group`);
    this.field.remove(`${id}-project`);
    this.field.remove(`${id}-role`);
  };

  generateProjectOptions = () => {
    return this.state.projects?.map((item) => {
      return {
        label: `${item.name}(${item.alias || '-'})`,
        value: item.name,
      };
    });
  };

  generateProjectRoleOptions = (projectName: string) => {
    const roles = this.state.projectRoles[projectName] || [];
    return roles.map((item) => {
      return {
        label: `${item.name}(${item.alias || '-'})`,
        value: item.name,
      };
    });
  };

  onSubmit = () => {
    this.field.validate((errs: any, values: Record<string, any>) => {
      if (errs) {
        return;
      }
      
      const { mappingItems } = this.state;
      const groupsMap: Record<string, GroupProjectRoleBase[]> = {};
      
      mappingItems.forEach((item) => {
        const group = values[`${item.id}-group`];
        const project = values[`${item.id}-project`];
        const role = values[`${item.id}-role`];
        
        if (group && project && role) {
          if (!groupsMap[group]) {
            groupsMap[group] = [];
          }
          groupsMap[group].push({ project, role });
        }
      });
      
      this.setState({ isLoading: true });
      updateGroupMappings({ groups: groupsMap })
        .then((res) => {
          Message.success(i18n.t('Group mappings updated successfully'));
          this.setState({ isLoading: false });
        })
        .catch((err) => {
          Message.error(err?.Message || i18n.t('Failed to update group mappings'));
          this.setState({ isLoading: false });
        });
    });
  };

  render() {
    const { mappingItems, isLoading } = this.state;
    const { init, getValue } = this.field;

    return (
      <div>
        <Title
          title={i18n.t('OIDC Group Mappings').toString()}
          subTitle={i18n.t('Configure OIDC group to project role mappings. These map OIDC group claims to project roles dynamically upon login.').toString()}
          extButtons={[
            <Button key="save" type="primary" onClick={this.onSubmit} loading={isLoading}>
              <Translation>Save</Translation>
            </Button>
          ]}
        />
        <div className="margin-top-20" style={{ padding: '0 20px' }}>
          <Form field={this.field}>
              {mappingItems.map((item, index) => {
                const projectValue = getValue(`${item.id}-project`) as string;
                return (
                  <Row key={item.id} gutter={16} className="margin-bottom-10">
                    <Col span={7}>
                      <FormItem required>
                        <Input
                          {...init(`${item.id}-group`, {
                            rules: [{ required: true, message: 'Group name is required' }],
                          })}
                          placeholder={i18n.t('OIDC Group Name').toString()}
                        />
                      </FormItem>
                    </Col>
                    <Col span={7}>
                      <FormItem required>
                        <Select
                          {...init(`${item.id}-project`, {
                            rules: [{ required: true, message: 'Project is required' }],
                          })}
                          placeholder={i18n.t('Select Project').toString()}
                          dataSource={this.generateProjectOptions()}
                          style={{ width: '100%' }}
                          showSearch
                        />
                      </FormItem>
                    </Col>
                    <Col span={7}>
                      <FormItem required>
                        <Select
                          {...init(`${item.id}-role`, {
                            rules: [{ required: true, message: 'Role is required' }],
                          })}
                          placeholder={i18n.t('Select Role').toString()}
                          dataSource={this.generateProjectRoleOptions(projectValue || item.project)}
                          style={{ width: '100%' }}
                          disabled={!projectValue && !item.project}
                        />
                      </FormItem>
                    </Col>
                    <Col span={3}>
                      <Button
                        text
                        onClick={() => this.onRemoveItem(item.id)}
                        className="margin-top-10"
                      >
                        <AiOutlineDelete size={16} />
                      </Button>
                    </Col>
                  </Row>
                );
              })}
              <Row>
                <Col span={24}>
                  <Button type="secondary" onClick={this.onAddItem}>
                    <AiOutlinePlus /> <Translation>Add Mapping</Translation>
                  </Button>
                </Col>
              </Row>
            </Form>
          </div>
      </div>
    );
  }
}

export default GroupMappings;
