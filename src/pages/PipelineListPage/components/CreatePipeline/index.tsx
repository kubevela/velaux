import React from 'react';
import { Button, Field, Form, Grid, Icon, Input, Message, Select, Upload } from '@b-design/ui';
import DrawerWithFooter from '../../../../components/Drawer';
import Translation from '../../../../components/Translation';
import DefinitionCode from '../../../../components/DefinitionCode';
import i18n from '../../../../i18n';
import * as yaml from 'js-yaml';
import { connect } from 'dva';
import type { LoginUserInfo } from '../../../../interface/user';
import { checkPermission } from '../../../../utils/permission';
import classNames from 'classnames';
import { createPipeline, loadPipeline, updatePipeline } from '../../../../api/pipeline';
import { v4 as uuid } from 'uuid';
import type { Pipeline, PipelineDetail } from '../../../../interface/pipeline';
import { checkName } from '../../../../utils/common';
import locale from '../../../../utils/locale';

const FormItem = Form.Item;

const { Row, Col } = Grid;

export interface PipelineProps {
  onClose: () => void;
  onSuccess?: () => void;
  userInfo?: LoginUserInfo;
  pipeline?: Pipeline;
}

type State = {
  configError?: string[];
  containerId: string;
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
      loadPipeline({ projectName: pipeline.project.name, pipelineName: pipeline.name }).then(
        (res: PipelineDetail) => {
          this.field.setValues({
            name: res.name,
            project: res.project.name,
            alias: res.alias,
            description: res.description,
            steps: yaml.dump(res.spec.steps),
            stepMode: res.spec.mode?.steps,
            subStepMode: res.spec.mode?.subSteps,
          });
        },
      );
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
      const stepArray: any = yaml.load(steps);
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
      if (pipeline) {
        updatePipeline(request).then((res) => {
          if (res) {
            Message.success(i18n.t('Pipeline updated successfully'));
            if (this.props.onSuccess) {
              this.props.onSuccess();
            }
          }
        });
      } else {
        createPipeline(request).then((res) => {
          if (res) {
            Message.success(i18n.t('Pipeline created successfully'));
            if (this.props.onSuccess) {
              this.props.onSuccess();
            }
          }
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
    const projectOptions: { label: string; value: string }[] = [];
    (userInfo?.projects || []).map((project) => {
      if (
        checkPermission(
          { resource: `project:${project.name}/pipeline:*`, action: 'create' },
          project.name,
          userInfo,
        )
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
    const { configError, containerId } = this.state;
    const modeOptions = [{ value: 'StepByStep' }, { value: 'DAG' }];

    return (
      <DrawerWithFooter
        title={i18n.t(pipeline == undefined ? 'New Pipeline' : 'Edit Pipeline')}
        onClose={this.props.onClose}
        onOk={this.onSubmit}
      >
        <Form field={this.field}>
          <Row wrap>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem required label={<Translation>Name</Translation>}>
                <Input
                  name="name"
                  disabled={pipeline != undefined}
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
            <Col span={24} style={{ padding: '0 8px' }}>
              <FormItem
                className={classNames({
                  'has-error': configError != undefined && configError.length > 0,
                })}
                label={<Translation>Steps</Translation>}
                required
              >
                <Upload request={this.customRequest}>
                  <Button text type="normal" className="padding-left-0">
                    <Icon type="cloudupload" />
                    <Translation>Upload YAML File</Translation>
                  </Button>
                </Upload>
                <div id={containerId} className="guide-code">
                  <DefinitionCode
                    containerId={containerId}
                    {...init<string>('steps', {
                      rules: [
                        {
                          validator: (rule, v: string, callback) => {
                            const message = 'Please input the valid Pipeline Steps YAML.';
                            try {
                              const pipelineSteps: any = yaml.load(v);
                              const stepMessage = this.checkStepConfig(pipelineSteps);
                              callback(stepMessage.toString());
                              this.setState({ configError: stepMessage });
                            } catch (err) {
                              this.setState({ configError: [message + err] });
                              callback(message + err);
                            }
                          },
                        },
                      ],
                    })}
                    language={'yaml'}
                    readOnly={false}
                    ref={this.DefinitionCodeRef}
                  />
                </div>
                {configError && (
                  <div className="next-form-item-help" style={{ marginTop: '24px' }}>
                    {configError.map((m) => {
                      return <p>{m}</p>;
                    })}
                  </div>
                )}
              </FormItem>
            </Col>
          </Row>
        </Form>
      </DrawerWithFooter>
    );
  }
}

export default CreatePipeline;
