import { Field, Form, Grid, Input, Message, Select } from '@alifd/next';
import { connect } from 'dva';
import * as yaml from 'js-yaml';
import React from 'react';
import { v4 as uuid } from 'uuid';

import { createPipeline, createPipelineContext, loadPipeline, updatePipeline } from '../../../../api/pipeline';
import type DefinitionCode from '../../../../components/DefinitionCode';
import DrawerWithFooter from '../../../../components/Drawer';
import { If } from '../../../../components/If';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { PipelineBase, PipelineDetail, PipelineListItem , LoginUserInfo } from '@velaux/data';
import { checkName } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
import { checkPermission } from '../../../../utils/permission';

import { templates } from './pipeline-template';
const FormItem = Form.Item;

const { Row, Col } = Grid;

export interface PipelineProps {
  onClose: () => void;
  onSuccess?: (pipeline: PipelineBase) => void;
  userInfo?: LoginUserInfo;
  pipeline?: PipelineListItem;
}

type State = {
  configError?: string[];
  containerId: string;
  defaultContext?: Record<string, string>;
  loading?: boolean;
};

@connect((store: any) => {
  return { ...store.user };
})
class CreatePipeline extends React.Component<PipelineProps, State> {
  field: Field;
  DefinitionCodeRef: React.RefObject<DefinitionCode>;
  constructor(props: PipelineProps) {
    super(props);
    this.field = new Field(this);
    this.DefinitionCodeRef = React.createRef();
    this.state = {
      containerId: uuid(),
    };
  }

  componentDidMount() {
    const { pipeline } = this.props;
    if (pipeline) {
      loadPipeline({ projectName: pipeline.project.name, pipelineName: pipeline.name }).then((res: PipelineDetail) => {
        this.field.setValues({
          name: res.name,
          project: res.project.name,
          alias: res.alias,
          description: res.description,
          steps: yaml.dump(res.spec.steps),
          stepMode: res.spec.mode?.steps,
          subStepMode: res.spec.mode?.subSteps,
        });
      });
    }
  }

  onSubmit = () => {
    const { pipeline } = this.props;
    this.field.validate((errs: any, values: any) => {
      if (errs) {
        if (errs.config && Array.isArray(errs.config.errors) && errs.config.errors.length > 0) {
          this.setState({ configError: errs.config.errors });
        }
        return;
      }
      const { name, steps, project, alias, description, stepMode, subStepMode } = values;

      let stepArray: any = [];
      if (steps) {
        stepArray = yaml.load(steps) || [];
      }
      const request = {
        project,
        alias,
        description,
        name: name,
        spec: {
          steps: stepArray,
          mode: {
            steps: stepMode,
            subSteps: subStepMode,
          },
        },
      };
      this.setState({ loading: true });
      if (pipeline) {
        updatePipeline(request)
          .then((res) => {
            if (res) {
              Message.success(i18n.t('Pipeline updated successfully'));
              if (this.props.onSuccess) {
                this.props.onSuccess(res);
              }
            }
          })
          .finally(() => {
            this.setState({ loading: false });
          });
      } else {
        createPipeline(request)
          .then((res) => {
            if (res) {
              // Create the default context
              const { defaultContext } = this.state;
              if (defaultContext) {
                const contextValues: {
                  key: string;
                  value: string;
                }[] = [];
                Object.keys(defaultContext).map((key) => {
                  contextValues.push({ key: key, value: defaultContext[key] });
                });
                createPipelineContext(project, name, { name: 'default', values: contextValues });
              }
              Message.success(i18n.t('Pipeline created successfully'));
              if (this.props.onSuccess) {
                this.props.onSuccess(res);
              }
            }
          })
          .finally(() => {
            this.setState({ loading: false });
          });
      }
    });
  };

  customRequest = (option: any) => {
    const reader = new FileReader();
    const fileSelect = option.file;
    reader.readAsText(fileSelect);
    reader.onload = () => {
      this.field.setValues({
        steps: reader.result?.toString() || '',
      });
    };
    return {
      file: File,
      onError: () => {},
      abort() {},
    };
  };

  checkStepConfig = (data: any) => {
    if (!data || !Array.isArray(data)) {
      return ['The YAML content is not a valid array.'];
    }
    const messages: string[] = [];
    data.map((step, i) => {
      if (!step) {
        messages.push(`[${i}] Step is invalid.`);
        return;
      }
      if (!step.name) {
        messages.push(`[${i}] Step is not named.`);
        return;
      }
      if (!step.type) {
        messages.push(`[${i}] Step does not specify a type.`);
        return;
      }
    });
    return messages;
  };

  render() {
    const { init } = this.field;
    const { userInfo, pipeline } = this.props;
    let defaultProject = '';
    const editMode = pipeline != undefined;
    const projectOptions: Array<{ label: string; value: string }> = [];
    (userInfo?.projects || []).map((project) => {
      if (
        checkPermission({ resource: `project:${project.name}/pipeline:*`, action: 'create' }, project.name, userInfo)
      ) {
        if (project.name === 'default') {
          defaultProject = project.name;
        }
        projectOptions.push({
          label: project.alias ? `${project.alias}(${project.name})` : project.name,
          value: project.name,
        });
      }
    });
    const modeOptions = [{ value: 'StepByStep' }, { value: 'DAG' }];
    const { loading } = this.state;
    return (
      <DrawerWithFooter
        title={i18n.t(!editMode ? 'New Pipeline' : 'Edit Pipeline')}
        onClose={this.props.onClose}
        onOk={this.onSubmit}
        onOkButtonLoading={loading}
      >
        <Form field={this.field}>
          <Row wrap>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem required label={<Translation>Name</Translation>}>
                <Input
                  name="name"
                  disabled={editMode}
                  {...init('name', {
                    initValue: '',
                    rules: [
                      {
                        pattern: checkName,
                        message: 'Please input a valid name',
                      },
                      {
                        required: true,
                        message: 'Please input a name',
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
                  placeholder={i18n.t('Give your pipeline a more recognizable name').toString()}
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
            <Col span={24} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Project</Translation>} required>
                <Select
                  name="project"
                  placeholder={i18n.t('Please select a project').toString()}
                  dataSource={projectOptions}
                  filterLocal={true}
                  hasClear={true}
                  disabled={editMode}
                  style={{ width: '100%' }}
                  {...init('project', {
                    initValue: defaultProject,
                    rules: [
                      {
                        required: true,
                        message: 'Please select a project',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem required label={<Translation>Step Mode</Translation>}>
                <Select
                  name="stepMode"
                  {...init('stepMode', {
                    initValue: 'StepByStep',
                  })}
                  locale={locale().Select}
                  dataSource={modeOptions}
                />
              </FormItem>
            </Col>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem required label={<Translation>Sub Step Mode</Translation>}>
                <Select
                  name="subStepMode"
                  {...init('subStepMode', {
                    initValue: 'DAG',
                  })}
                  locale={locale().Select}
                  dataSource={modeOptions}
                />
              </FormItem>
            </Col>
            <Col span={24} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Description</Translation>}>
                <Input
                  name="description"
                  {...init('description', {
                    rules: [
                      {
                        maxLength: 128,
                        message: 'Enter a description less than 128 characters.',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
            <If condition={!editMode}>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Template</Translation>}>
                  <Select
                    locale={locale().Select}
                    name="template"
                    dataSource={templates}
                    hasClear
                    placeholder="Select a template"
                    onChange={(value) => {
                      this.field.setValue('steps', value);
                      const template = templates.find((t) => t.value == value);
                      this.setState({ defaultContext: template?.defaultContext });
                    }}
                  />
                </FormItem>
              </Col>
            </If>
          </Row>
        </Form>
      </DrawerWithFooter>
    );
  }
}

export default CreatePipeline;
