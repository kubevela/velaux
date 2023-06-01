import { Dialog, Field, Form, Grid, Input, Loading, Message, Select } from '@alifd/next';
import { connect } from 'dva';
import React from 'react';

import { createPipeline, createPipelineContext, listPipelineContexts, loadPipeline } from '../../../../api/pipeline';
import { If } from '../../../../components/If';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { PipelineListItem, PipelineDetail , LoginUserInfo } from '@velaux/data';
import { checkName } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
import { checkPermission } from '../../../../utils/permission';
import {KeyValue} from '@velaux/data';

const FormItem = Form.Item;

const { Row, Col } = Grid;

export interface PipelineProps {
  onClose: () => void;
  onSuccess?: () => void;
  userInfo?: LoginUserInfo;
  pipeline?: PipelineListItem;
}

type State = {
  loading: boolean;
  loadingContext: boolean;
  pipelineDetail?: PipelineDetail;
  contexts?: Record<string, KeyValue[]>;
  cloneLoading?: boolean;
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
      loadingContext: true,
    };
    this.field = new Field(this);
  }

  componentDidMount() {
    const { pipeline } = this.props;
    if (pipeline) {
      this.onLoadingPipeline(pipeline);
      this.onLoadingPipelineContexts(pipeline);
    }
  }

  onLoadingPipeline = async (pipeline: PipelineListItem) => {
    loadPipeline({ projectName: pipeline.project.name, pipelineName: pipeline.name })
      .then((res: PipelineDetail) => {
        this.setState({ pipelineDetail: res });
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  };

  onLoadingPipelineContexts = async (pipeline: PipelineListItem) => {
    listPipelineContexts(pipeline.project.name, pipeline.name)
      .then((res) => {
        this.setState({ contexts: res && res.contexts ? res.contexts : {} });
      })
      .finally(() => {
        this.setState({ loadingContext: false });
      });
  };
  onSubmit = () => {
    const { pipelineDetail, contexts } = this.state;
    if (pipelineDetail) {
      this.setState({ cloneLoading: true });
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
        createPipeline(request)
          .then((res) => {
            if (res) {
              if (contexts) {
                Object.keys(contexts).map((key) => {
                  createPipelineContext(project, name, { name: key, values: contexts[key] as {key: string, value: string}[] });
                });
              }
              Message.success(i18n.t('Pipeline cloned successfully'));
              if (this.props.onSuccess) {
                this.props.onSuccess();
              }
            }
          })
          .catch(() => {
            this.setState({ cloneLoading: false });
          });
      });
    }
  };

  render() {
    const { loading, pipelineDetail, loadingContext, contexts, cloneLoading } = this.state;
    const { userInfo } = this.props;
    const { init } = this.field;
    const projectOptions: Array<{ label: string; value: string }> = [];
    (userInfo?.projects || []).map((project) => {
      if (
        checkPermission({ resource: `project:${project.name}/pipeline:*`, action: 'create' }, project.name, userInfo)
      ) {
        projectOptions.push({
          label: project.alias ? `${project.alias}(${project.name})` : project.name,
          value: project.name,
        });
      }
    });
    const message = contexts ? i18n.t('Includes') + ` ${Object.keys(contexts).length} ` + i18n.t('contexts') : '';
    return (
      <Dialog
        onOk={this.onSubmit}
        okProps={{
          loading: cloneLoading,
        }}
        onClose={this.props.onClose}
        onCancel={this.props.onClose}
        locale={locale().Dialog}
        visible
        v2
        title="Clone Pipeline"
      >
        <Loading visible={loading || loadingContext}>
          <If condition={pipelineDetail && contexts}>
            <Message type="success" title={i18n.t('Pipeline loaded successfully and is ready to clone.') + message} />
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
            <Message type="notice" title={i18n.t('Pipeline loading').toString()} />
          </If>
        </Loading>
      </Dialog>
    );
  }
}

export default ClonePipeline;
