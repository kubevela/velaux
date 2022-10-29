import React from 'react';
import { Dialog, Field, Form, Grid, Input, Loading, Message, Select } from '@b-design/ui';
import i18n from '../../../../i18n';
import { connect } from 'dva';
import type { LoginUserInfo } from '../../../../interface/user';
import { checkPermission } from '../../../../utils/permission';
import { createPipeline, loadPipeline } from '../../../../api/pipeline';
import type { Pipeline, PipelineDetail } from '../../../../interface/pipeline';
import Translation from '../../../../components/Translation';
import { checkName } from '../../../../utils/common';
import { If } from 'tsx-control-statements/components';

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
  loading: boolean;
  pipelineDetail?: PipelineDetail;
};

@connect((store: any) => {
  return { ...store.user };
})
class ClonePipeline extends React.Component<PipelineProps, State> {
  field: Field;
  constructor(props: PipelineProps) {
    super(props);
    this.state = {
      loading: true,
    };
    this.field = new Field(this);
  }

  componentDidMount() {
    const { pipeline } = this.props;
    if (pipeline) {
      loadPipeline({ projectName: pipeline.project.name, pipelineName: pipeline.name })
        .then((res: PipelineDetail) => {
          this.setState({ pipelineDetail: res });
        })
        .finally(() => {
          this.setState({ loading: false });
        });
    }
  }

  onSubmit = () => {
    const { pipelineDetail } = this.state;
    if (pipelineDetail) {
      this.field.validate((errs: any, values: any) => {
        if (errs) {
          return;
        }
        const { name, project, alias, description } = values;
        const request = {
          project,
          alias,
          description,
          name: name,
          spec: pipelineDetail?.spec,
        };
        createPipeline(request).then((res) => {
          if (res) {
            Message.success(i18n.t('Pipeline cloned successfully'));
            if (this.props.onSuccess) {
              this.props.onSuccess();
            }
          }
        });
      });
    }
  };

  render() {
    const { loading, pipelineDetail } = this.state;
    const { userInfo } = this.props;
    const { init } = this.field;
    const projectOptions: { label: string; value: string }[] = [];
    (userInfo?.projects || []).map((project) => {
      if (
        checkPermission(
          { resource: `project:${project.name}/pipeline:*`, action: 'create' },
          project.name,
          userInfo,
        )
      ) {
        projectOptions.push({
          label: project.alias ? `${project.alias}(${project.name})` : project.name,
          value: project.name,
        });
      }
    });
    return (
      <Dialog
        onOk={this.onSubmit}
        onClose={this.props.onClose}
        onCancel={this.props.onClose}
        locale={locale().Dialog}
        visible
        className="commonDialog"
        title="Clone Pipeline"
      >
        <Loading visible={loading}>
          <If condition={pipelineDetail}>
            <Message
              type="success"
              title={i18n.t('Pipeline loaded successfully and is ready to clone.')}
            />
            <Form field={this.field}>
              <Row wrap>
                <Col span={8} style={{ padding: '0 8px' }}>
                  <FormItem required label={<Translation>Name</Translation>}>
                    <Input
                      name="name"
                      {...init('name', {
                        initValue: pipelineDetail?.name && pipelineDetail?.name + '-clone',
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
                <Col span={8} style={{ padding: '0 8px' }}>
                  <FormItem label={<Translation>Project</Translation>} required>
                    <Select
                      name="project"
                      placeholder={i18n.t('Please select a project').toString()}
                      dataSource={projectOptions}
                      filterLocal={true}
                      hasClear={true}
                      style={{ width: '100%' }}
                      {...init('project', {
                        initValue: pipelineDetail?.project.name,
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
                <Col span={8} style={{ padding: '0 8px' }}>
                  <FormItem label={<Translation>Alias</Translation>}>
                    <Input
                      name="alias"
                      placeholder={i18n.t('Give your pipeline a more recognizable name').toString()}
                      {...init('alias', {
                        initValue: pipelineDetail?.alias,
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
                  <FormItem label={<Translation>Description</Translation>}>
                    <Input
                      name="description"
                      {...init('description', {
                        initValue: pipelineDetail?.description,
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
              </Row>
            </Form>
          </If>
          <If condition={!pipelineDetail}>
            <Message type="notice" title={i18n.t('Pipeline loading')} />
          </If>
        </Loading>
      </Dialog>
    );
  }
}

export default ClonePipeline;
