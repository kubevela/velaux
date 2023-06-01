import { Message, Grid, Dialog, Form, Input, Field, Select, Loading, Button, Table } from '@alifd/next';
import React from 'react';

import { getClusterList } from '../../../../api/cluster';
import { createEnv, updateEnv } from '../../../../api/env';
import { listNamespaces } from '../../../../api/observation';
import { getProjectTargetList } from '../../../../api/project';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { Cluster , Env , Target , LoginUserInfo, UserProject } from '@velaux/data';
import { checkName } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
import { checkPermission } from '../../../../utils/permission';
import TargetDialog from '../../../TargetList/components/TargetDialog';

type Props = {
  project?: string;
  isEdit?: boolean;
  visible: boolean;
  projects: UserProject[];

  envItem?: Env;
  userInfo?: LoginUserInfo;
  onOK: () => void;
  onClose: () => void;
};

type State = {
  targets?: Target[];
  namespaces?: Array<{ label: string; value: string }>;
  targetLoading: boolean;
  submitLoading: boolean;
  newTarget: boolean;
  clusterList?: Cluster[];
};

class EnvDialog extends React.Component<Props, State> {
  field: Field;

  constructor(props: Props) {
    super(props);
    this.field = new Field(this, {
      onChange: (name: string, value: string) => {
        if (name == 'project') {
          this.loadProjectTarget(value);
        }
      },
    });
    this.state = {
      targetLoading: false,
      submitLoading: false,
      newTarget: false,
    };
  }

  componentDidMount() {
    const { envItem, isEdit } = this.props;
    let projectName = this.props.project;
    if (envItem && isEdit) {
      const { name, alias, description, targets, namespace, project } = envItem;
      const targetNames = targets?.map((target) => {
        return target.name;
      });
      projectName = project.name;
      this.field.setValues({
        name,
        alias,
        namespace,
        description,
        targets: targetNames,
        project: project.name,
      });
    }
    if (projectName) {
      this.loadProjectTarget(projectName);
    }
    this.loadClusters();
  }

  loadClusters = () => {
    if (checkPermission({ resource: 'cluster', action: 'list' }, '', this.props.userInfo)) {
      getClusterList({}).then((res) => {
        if (res) {
          this.setState({ clusterList: res.clusters });
        }
      });
    }
  };

  onClose = () => {
    this.props.onClose();
    this.resetField();
  };

  loadProjectTarget = async (projectName: string, callback?: () => void) => {
    this.setState({ targetLoading: true });
    getProjectTargetList({ projectName }).then((res) => {
      if (res) {
        this.setState({ targets: res.targets, targetLoading: false }, callback);
      }
    });
  };

  makeTargetDataSource = () => {
    const { targets } = this.state;
    const selectTargets: string[] = this.field.getValue('targets');
    const targetMap = new Map();
    if (!targets || !selectTargets) {
      return [];
    }
    targets?.map((t) => {
      targetMap.set(t.name, t);
    });
    const data = selectTargets
      .filter((t) => targetMap.get(t))
      .map((t) => {
        return targetMap.get(t);
      });
    return data;
  };

  onOk = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      this.setState({ submitLoading: true });
      const { isEdit } = this.props;
      const { name, alias, description, targets, namespace, project } = values;
      const params = {
        name,
        alias,
        description,
        namespace,
        project: project || 'default',
        targets,
      };

      if (isEdit) {
        updateEnv(params).then((res) => {
          this.setState({ submitLoading: false });
          if (res) {
            Message.success(<Translation>Environment updated successfully</Translation>);
            this.props.onOK();
            this.onClose();
          }
        });
      } else {
        createEnv(params).then((res) => {
          this.setState({ submitLoading: false });
          if (res) {
            Message.success(<Translation>Environment created successfully</Translation>);
            this.props.onOK();
            this.onClose();
          }
        });
      }
    });
  };

  resetField() {
    this.field.setValues({
      name: '',
      alias: '',
      description: '',
      project: '',
      targets: [],
      namespace: '',
    });
  }

  convertTarget = () => {
    const { targets } = this.state;
    return (targets || []).map((target: Target) => ({
      label: `${target.alias || target.name}(${target.cluster?.clusterName}/${target.cluster?.namespace})`,
      value: target.name,
    }));
  };

  loadNamespaces = async (cluster: string | undefined) => {
    if (cluster) {
      listNamespaces({ cluster: cluster }).then((re) => {
        if (re && re.list) {
          const namespaces = re.list.map((item: any) => {
            return { label: item.metadata.name, value: item.metadata.name };
          });
          this.setState({ namespaces: namespaces });
        }
      });
    }
  };

  showNewTarget = () => {
    this.setState({ newTarget: true });
  };

  render() {
    const { Col, Row } = Grid;
    const FormItem = Form.Item;
    const init = this.field.init;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 18,
      },
    };

    const { visible, isEdit, projects, userInfo } = this.props;
    const { targetLoading, submitLoading, newTarget, clusterList } = this.state;
    const projectOptions: Array<{ label: string; value: string }> = [];
    (projects || []).map((project) => {
      if (
        checkPermission({ resource: `project:${project.name}/environment:*`, action: 'create' }, project.name, userInfo)
      ) {
        projectOptions.push({
          label: project.alias ? `${project.alias}(${project.name})` : project.name,
          value: project.name,
        });
      }
    });
    return (
      <div>
        <Dialog
          v2
          locale={locale().Dialog}
          title={isEdit ? <Translation>Edit Environment</Translation> : <Translation>New Environment</Translation>}
          autoFocus={true}
          overflowScroll={true}
          visible={visible}
          onOk={this.onOk}
          onCancel={this.onClose}
          onClose={this.onClose}
          footerActions={['cancel', 'ok']}
          footer={
            <div>
              <Button onClick={this.onOk} type="primary" loading={submitLoading}>
                <Translation>OK</Translation>
              </Button>
            </div>
          }
        >
          <Form {...formItemLayout} field={this.field}>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Name</Translation>} required>
                  <Input
                    name="name"
                    disabled={isEdit}
                    placeholder={i18n.t('Please enter the Environment name').toString()}
                    {...init('name', {
                      rules: [
                        {
                          required: true,
                          pattern: checkName,
                          message: (
                            <Translation>Please enter a valid name contains only alphabetical words</Translation>
                          ),
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Alias</Translation>}>
                  <Input
                    name="alias"
                    placeholder={i18n.t('Please enter the Environment alias').toString()}
                    {...init('alias', {
                      rules: [
                        {
                          minLength: 2,
                          maxLength: 64,
                          message: <Translation>Enter a string of 2 to 64 characters</Translation>,
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Environment Namespace</Translation>}>
                  <Input
                    name="namespace"
                    disabled={isEdit}
                    placeholder={i18n.t('By default, it is the same as the Environment name').toString()}
                    {...init('namespace', {
                      rules: [
                        {
                          pattern: checkName,
                          message: <Translation>please enter a valid English name</Translation>,
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Description</Translation>}>
                  <Input
                    name="description"
                    placeholder={i18n.t('Please enter the Environment description').toString()}
                    {...init('description', {
                      rules: [
                        {
                          maxLength: 256,
                          message: (
                            <Translation>Enter a description that contains less than 256 characters</Translation>
                          ),
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Project</Translation>} required>
                  <Select
                    name="project"
                    hasClear
                    showSearch
                    placeholder={i18n.t('Please select a project').toString()}
                    filterLocal={true}
                    dataSource={projectOptions}
                    style={{ width: '100%' }}
                    {...init('project', {
                      rules: [
                        {
                          required: true,
                          message: i18n.t('Please select a project'),
                        },
                      ],
                      initValue: this.props.project,
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
            <If condition={this.field.getValue('project')}>
              <Row wrap={true}>
                <Col span={24} style={{ padding: '0 8px' }}>
                  <Loading visible={targetLoading} style={{ width: '100%' }}>
                    <FormItem label={<Translation>Target</Translation>} required>
                      <Select
                        locale={locale().Select}
                        className="select"
                        mode="multiple"
                        placeholder={i18n.t('Please select a target').toString()}
                        {...init(`targets`, {
                          rules: [
                            {
                              required: true,
                              message: 'Please select at least one target',
                            },
                          ],
                          initValue: [],
                        })}
                        dataSource={this.convertTarget()}
                      />
                    </FormItem>
                  </Loading>
                </Col>
                <Permission
                  request={{ resource: 'target:*', action: 'create' }}
                  project={this.field.getValue('project')}
                >
                  <Col className="flexright">
                    <Button onClick={this.showNewTarget} type="secondary" style={{ marginBottom: '16px' }}>
                      <Translation>New Target</Translation>
                    </Button>
                  </Col>
                </Permission>
              </Row>
              <Row>
                <Col span={24} style={{ padding: '0 8px' }}>
                  <Table locale={locale().Table} dataSource={this.makeTargetDataSource()}>
                    <Table.Column
                      dataIndex={'name'}
                      title={i18n.t('Name').toString()}
                      cell={(v: string, i: number, t: Target) => {
                        if (t.alias) {
                          return `${t.name}(${t.alias})`;
                        }
                        return t.name;
                      }}
                    />
                    <Table.Column dataIndex={'cluster.clusterName'} title={i18n.t('Cluster').toString()} />
                    <Table.Column dataIndex={'cluster.namespace'} title={i18n.t('Namespace').toString()} />
                  </Table>
                </Col>
              </Row>
            </If>
          </Form>
        </Dialog>
        <If condition={newTarget}>
          <TargetDialog
            visible={newTarget}
            clusterList={clusterList || []}
            isEdit={false}
            liteMode={true}
            project={this.field.getValue('project')}
            onClose={() => {
              this.setState({ newTarget: false });
            }}
            onOK={(name: string) => {
              if (this.field.getValue('project')) {
                this.loadProjectTarget(this.field.getValue('project'), () => {
                  const existTarget: string[] = this.field.getValue('targets') || [];
                  existTarget.push(name);
                  this.field.setValue('targets', existTarget);
                });
              }
              this.setState({
                newTarget: false,
              });
            }}
          />
        </If>
      </div>
    );
  }
}

export default EnvDialog;
