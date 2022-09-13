import React from 'react';
import { Message, Grid, Dialog, Form, Input, Field, Select, Loading } from '@b-design/ui';
import Group from '../../../../extends/Group';
import Namespace from '../Namespace';
import type { NamespaceItem } from '../Namespace';
import { checkName } from '../../../../utils/common';
import { createTarget, updateTarget } from '../../../../api/target';
import { getCloudServiceProviderList, getProjectList } from '../../../../api/project';
import type { Target, ProvideList } from '../../../../interface/target';
import Translation from '../../../../components/Translation';
import type { Cluster } from '../../../../interface/cluster';
import type { Project } from '../../../../interface/project';
import { listNamespaces } from '../../../../api/observation';
import locale from '../../../../utils/locale';
import { getSelectLabel } from '../../../../utils/utils';
import i18n from '../../../../i18n';
import { If } from 'tsx-control-statements/components';

type Props = {
  project?: string;
  isEdit?: boolean;
  visible: boolean;
  clusterList: Cluster[];
  targetItem?: Target;
  liteMode?: boolean;
  onOK: (name: string) => void;
  onClose: () => void;
};

type State = {
  cluster?: string;
  namespaces: NamespaceItem[];
  providerList: ProvideList[];
  projects?: Project[];
  isLoading: boolean;
};

class TargetDialog extends React.Component<Props, State> {
  field: Field;

  constructor(props: Props) {
    super(props);
    this.field = new Field(this, {
      onChange: (name: string, value: any) => {
        if (name == 'clusterName') {
          this.setState({ namespaces: [] }, () => {
            this.loadNamespaces(value);
          });
          this.field.setValue('runtimeNamespace', '');
          props.clusterList?.map((cluster) => {
            if (cluster.name == value && cluster.providerInfo) {
              this.field.setValues({
                var_region: cluster.providerInfo.regionID,
                var_zone: cluster.providerInfo.zoneID,
                var_vpcID: cluster.providerInfo.vpcID,
              });
              if (cluster.providerInfo.provider == 'aliyun') {
                this.field.setValue('var_providerName', 'default');
              }
            }
          });
        }
      },
    });

    this.state = {
      namespaces: [],
      providerList: [],
      isLoading: true,
    };
  }

  componentDidMount() {
    const { targetItem } = this.props;
    if (targetItem) {
      const {
        name,
        alias,
        description,
        cluster = { clusterName: '', namespace: '' },
        variable = { providerName: '', region: '', zone: '', vpcID: '' },
        project = { name: '', alias: '' },
      } = targetItem;
      this.field.setValues({
        name,
        alias,
        description,
        clusterName: cluster.clusterName,
        runtimeNamespace: cluster.namespace,
        var_providerName: variable.providerName,
        var_region: variable.region,
        var_zone: variable.zone,
        var_vpcID: variable.vpcID,
        project: project.name,
      });
      if (cluster) {
        this.loadNamespaces(cluster.clusterName);
      }
      if (project.name) {
        this.getProviderList(project.name);
      }
    }
    this.listProjects();
  }

  listProjects = async () => {
    this.setState({ isLoading: true });
    getProjectList({ page: 0, pageSize: 0 })
      .then((res) => {
        this.setState({
          projects: res.projects || [],
          isLoading: false,
        });
      })
      .catch(() => {
        this.setState({ isLoading: false });
      });
  };

  onClose = () => {
    this.props.onClose();
    this.resetField();
  };

  onOk = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { isEdit, liteMode } = this.props;
      const {
        name,
        alias,
        description,
        clusterName,
        runtimeNamespace,
        var_providerName,
        var_region,
        var_zone,
        var_vpcID,
        project,
      } = values;
      const params = {
        name,
        alias,
        description,
        cluster: {
          clusterName,
          namespace: runtimeNamespace,
        },
        variable: {
          providerName: var_providerName,
          region: var_region,
          zone: var_zone,
          vpcID: var_vpcID,
        },
        project,
      };

      if (liteMode) {
        params.name = params.cluster.clusterName + '-' + runtimeNamespace;
        params.project = this.props.project;
      }

      if (isEdit) {
        updateTarget(params).then((res) => {
          if (res) {
            Message.success(<Translation>Target updated successfully</Translation>);
            this.props.onOK(params.name);
            this.onClose();
          }
        });
      } else {
        createTarget(params).then((res) => {
          if (res) {
            Message.success(<Translation>Target created successfully</Translation>);
            this.props.onOK(params.name);
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
      clusterName: '',
      namespace: '',
      providerName: '',
      region: '',
      zone: '',
      vpcID: '',
    });
  }

  transCluster = () => {
    const { clusterList } = this.props;
    return (clusterList || []).map((item) => ({
      label: item.alias || item.name,
      value: item.name,
    }));
  };

  loadNamespaces = async (cluster: string | undefined) => {
    if (cluster) {
      listNamespaces({ cluster: cluster }).then((re) => {
        if (re && re.list) {
          const namespaces: NamespaceItem[] = [];
          re.list.map((item: any) => {
            if (item.metadata.labels && item.metadata.labels['namespace.oam.dev/target']) {
              return;
            }
            namespaces.push({ label: item.metadata.name, value: item.metadata.name });
          });
          this.setState({ namespaces: namespaces });
        }
      });
    }
  };

  getProviderList = async (projectName: string) => {
    getCloudServiceProviderList(projectName).then((res) => {
      if (res && Array.isArray(res)) {
        this.setState({
          providerList: res,
        });
      } else {
        this.setState({
          providerList: [],
        });
      }
    });
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

    const { visible, isEdit, liteMode } = this.props;
    const { namespaces, projects, isLoading } = this.state;
    const cluster: string = this.field.getValue('clusterName');

    const projectOptions = projects?.map((project) => {
      return {
        label: project.alias ? project.alias : project.name,
        value: project.name,
      };
    });
    const { providerList } = this.state;
    const providerListOptions = getSelectLabel(providerList);
    return (
      <div>
        <Dialog
          locale={locale().Dialog}
          className={'commonDialog'}
          height="auto"
          title={
            isEdit ? <Translation>Edit Target</Translation> : <Translation>New Target</Translation>
          }
          autoFocus={true}
          isFullScreen={true}
          visible={visible}
          onOk={this.onOk}
          onCancel={this.onClose}
          onClose={this.onClose}
          footerActions={['ok']}
          footerAlign="center"
        >
          <Form {...formItemLayout} field={this.field}>
            <If condition={!liteMode}>
              <Row>
                <Col span={12} style={{ padding: '0 8px' }}>
                  <FormItem label={<Translation>Name</Translation>} required>
                    <Input
                      name="name"
                      disabled={isEdit}
                      placeholder={i18n.t('Please enter').toString()}
                      {...init('name', {
                        rules: [
                          {
                            required: true,
                            pattern: checkName,
                            message: 'Please enter a valid name contains only alphabetical words',
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
                      placeholder={i18n.t('Please enter').toString()}
                      {...init('alias', {
                        rules: [
                          {
                            minLength: 2,
                            maxLength: 64,
                            message: 'Enter a string of 2 to 64 characters.',
                          },
                        ],
                      })}
                    />
                  </FormItem>
                </Col>
              </Row>
              <Row>
                <Col span={24} style={{ padding: '0 8px' }}>
                  <Loading visible={isLoading} style={{ width: '100%' }}>
                    <FormItem label={<Translation>Project</Translation>} required>
                      <Select
                        name="project"
                        hasClear
                        showSearch
                        disabled={isEdit}
                        placeholder={i18n.t('Please select').toString()}
                        filterLocal={true}
                        dataSource={projectOptions}
                        readOnly={this.props.project != undefined}
                        style={{ width: '100%' }}
                        {...init('project', {
                          rules: [
                            {
                              required: true,
                              message: 'Please select project',
                            },
                          ],
                          initValue: this.props.project,
                        })}
                        onChange={(item: string) => {
                          this.field.setValue('var_providerName', '');
                          this.field.setValue('project', item);
                          this.getProviderList(item);
                        }}
                      />
                    </FormItem>
                  </Loading>
                </Col>
              </Row>

              <Row>
                <Col span={24} style={{ padding: '0 8px' }}>
                  <FormItem label={<Translation>Description</Translation>}>
                    <Input
                      name="description"
                      placeholder={i18n.t('Please enter').toString()}
                      {...init('description', {
                        rules: [
                          {
                            maxLength: 256,
                            message: 'Enter a description that contains less than 256 characters.',
                          },
                        ],
                      })}
                    />
                  </FormItem>
                </Col>
              </Row>
            </If>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Cluster</Translation>} required>
                  <Select
                    locale={locale().Select}
                    className="select"
                    disabled={isEdit}
                    placeholder={i18n.t('Please select').toString()}
                    {...init(`clusterName`, {
                      rules: [
                        {
                          required: true,
                          message: 'Please select',
                        },
                      ],
                    })}
                    dataSource={this.transCluster()}
                  />
                </FormItem>
              </Col>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Namespace</Translation>} required>
                  <Namespace
                    {...init(`runtimeNamespace`, {
                      rules: [
                        {
                          required: true,
                          message: 'Please select namesapce',
                        },
                      ],
                    })}
                    disabled={isEdit}
                    namespaces={namespaces}
                    loadNamespaces={this.loadNamespaces}
                    cluster={cluster}
                    createNamespaceDialog={true}
                    targetField={this.field}
                  />
                </FormItem>
              </Col>
            </Row>
            <If condition={!liteMode}>
              <Row>
                <Col span={24} style={{ padding: '0 8px' }}>
                  <Group
                    title={<Translation>Shared Variables</Translation>}
                    required={false}
                    description={
                      <Translation>You can define parameters such as region or zone</Translation>
                    }
                    hasToggleIcon
                  >
                    <Row>
                      <Col span={12} style={{ padding: '0 8px' }}>
                        <FormItem label={<Translation>Cloud Service Provider</Translation>}>
                          <Select
                            className="select"
                            placeholder={i18n.t('Please select').toString()}
                            {...init(`var_providerName`, {
                              rules: [
                                {
                                  required: false,
                                  message: i18n.t('Please select terraform provider name'),
                                },
                              ],
                            })}
                            dataSource={providerListOptions}
                          />
                        </FormItem>
                      </Col>
                      <Col span={12} style={{ padding: '0 8px' }}>
                        <FormItem label={<Translation>Region</Translation>}>
                          <Input
                            name="var_region"
                            placeholder={i18n.t('Please enter').toString()}
                            {...init('var_region', {
                              rules: [
                                {
                                  maxLength: 256,
                                  message: 'Enter a Region.',
                                },
                              ],
                            })}
                          />
                        </FormItem>
                      </Col>
                    </Row>
                  </Group>
                </Col>
              </Row>
            </If>
          </Form>
        </Dialog>
      </div>
    );
  }
}

export default TargetDialog;
