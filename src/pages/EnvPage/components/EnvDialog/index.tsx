import React from 'react';
import { Message, Grid, Dialog, Form, Input, Field, Select } from '@b-design/ui';
import { checkName } from '../../../../utils/common';
import type { Target } from '../../../../interface/target';
import Translation from '../../../../components/Translation';
import { listNamespaces } from '../../../../api/observation';
import locale from '../../../../utils/locale';
import type { Env } from '../../../../interface/env';
import type { Project } from '../../../../interface/project';
import { createEnv, updateEnv } from '../../../../api/env';
import i18n from '../../../../i18n';

type Props = {
  project?: string;
  isEdit?: boolean;
  visible: boolean;
  targets: Target[];
  projects: Project[];
  syncProjectList: () => void;
  envItem?: Env;
  onOK: () => void;
  onClose: () => void;
};

type State = {};

class EnvDialog extends React.Component<Props, State> {
  field: Field;

  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {};
  }

  componentDidMount() {
    const { envItem, isEdit } = this.props;
    if (envItem && isEdit) {
      const { name, alias, description, targets, namespace, project } = envItem;
      const targetNames = targets?.map((target) => {
        return target.name;
      });

      this.field.setValues({
        name,
        alias,
        namespace,
        description,
        targets: targetNames,
        project: project.name,
      });
    }
  }

  onClose = () => {
    this.props.onClose();
    this.resetField();
  };

  onOk = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
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
          if (res) {
            Message.success(<Translation>Update Env Success</Translation>);
            this.props.onOK();
            this.onClose();
          }
        });
      } else {
        createEnv(params).then((res) => {
          if (res) {
            Message.success(<Translation>Create Env Success</Translation>);
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
    const { targets } = this.props;
    return (targets || []).map((target: Target) => ({
      label: target.alias || target.name,
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

    const { visible, isEdit, projects } = this.props;
    const projectList = (projects || []).map((project) => {
      return {
        label: project.name,
        value: project.name,
      };
    });
    return (
      <div>
        <Dialog
          locale={locale.Dialog}
          className={'commonDialog'}
          height="auto"
          title={
            isEdit ? (
              <Translation>Edit Environment</Translation>
            ) : (
              <Translation>New Environment</Translation>
            )
          }
          autoFocus={true}
          isFullScreen={true}
          visible={visible}
          onOk={this.onOk}
          onCancel={this.onClose}
          onClose={this.onClose}
          footerActions={['cancel', 'ok']}
          footerAlign="center"
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
                          message: <Translation>Please enter a valid English name</Translation>,
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
                <FormItem label={<Translation>Namespace</Translation>}>
                  <Input
                    name="namespace"
                    disabled={isEdit}
                    placeholder={i18n
                      .t('By default, it is the same as the Environment name')
                      .toString()}
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
                            <Translation>
                              Enter a description that contains less than 256 characters
                            </Translation>
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
                  <Select.AutoComplete
                    name="project"
                    hasClear
                    placeholder={i18n.t('Please select').toString()}
                    filterLocal={true}
                    dataSource={projectList}
                    style={{ width: '100%' }}
                    {...init('project', {
                      rules: [
                        {
                          required: true,
                          message: 'Please select project',
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Target</Translation>} required>
                  <Select
                    locale={locale.Select}
                    className="select"
                    mode="multiple"
                    placeholder={i18n.t('Please select Target').toString()}
                    {...init(`targets`, {
                      rules: [
                        {
                          required: true,
                          message: 'Please select at least one target',
                        },
                      ],
                    })}
                    dataSource={this.convertTarget()}
                  />
                </FormItem>
              </Col>
            </Row>
          </Form>
        </Dialog>
      </div>
    );
  }
}

export default EnvDialog;
