import React from 'react';
import { connect } from 'dva';
import type { WorkflowMode } from '../../interface/application';
import type { Dispatch } from 'redux';
import { getWorkflowDefinitions } from '../../api/workflows';
import WorkflowStudio from '../../components/WorkflowStudio';
import { Breadcrumb, Button, Card, Form, Grid, Icon, Loading, Message, Select } from '@b-design/ui';
import Translation from '../../components/Translation';
import type { DefinitionBase } from '../../interface/definitions';
import { WorkflowContext } from '../../context';
import type { PipelineDetail, WorkflowStep } from '../../interface/pipeline';
import { WorkflowPrompt } from '../../components/WorkflowPrompt';
import _ from 'lodash';
import locale from '../../utils/locale';
import classNames from 'classnames';
import { ButtonGroup } from '@alifd/meet-react/lib/button';
import { WorkflowYAML } from '../../components/WorkflowYAML';
import { loadPipeline, updatePipeline } from '../../api/pipeline';
import { Link } from 'react-router-dom';
import i18n from '../../i18n';
import { If } from 'tsx-control-statements/components';
import RunPipeline from '../../components/RunPipeline';
import { routerRedux } from 'dva/router';

const { Row, Col } = Grid;

type Props = {
  dispatch: Dispatch<any>;
  match: { params: { projectName: string; pipelineName: string } };
};

type State = {
  pipeline?: PipelineDetail;
  definitions?: DefinitionBase[];
  steps?: WorkflowStep[];
  changed: boolean;
  saveLoading?: boolean;
  mode: WorkflowMode;
  subMode: WorkflowMode;
  editMode: 'visual' | 'yaml';
  showRunPipeline?: boolean;
};

@connect(() => {
  return {};
})
class PipelineStudio extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      changed: false,
      mode: 'StepByStep',
      subMode: 'DAG',
      editMode: 'visual',
    };
  }

  componentDidMount() {
    this.loadPipeline();
    this.loadWorkflowDefinitions();
  }

  componentDidUpdate(prevProps: Readonly<Props>): void {
    if (prevProps.match !== this.props.match) {
      this.loadPipeline();
    }
  }

  loadPipeline = () => {
    const {
      params: { projectName, pipelineName },
    } = this.props.match;

    loadPipeline({ projectName, pipelineName }).then((res: PipelineDetail) => {
      this.setState({
        pipeline: res,
        mode: res.spec.mode?.steps || 'StepByStep',
        subMode: res.spec.mode?.subSteps || 'DAG',
        steps: res.spec.steps,
      });
    });
  };

  loadWorkflowDefinitions = () => {
    getWorkflowDefinitions('WorkflowRun').then((res: any) => {
      if (res) {
        this.setState({
          definitions: res && res.definitions,
        });
      }
    });
  };

  onChange = (steps: WorkflowStep[]) => {
    const { pipeline } = this.state;
    this.setState({ steps: steps, changed: !_.isEqual(steps, pipeline?.spec.steps) });
  };

  onSave = () => {
    const { pipeline, steps, mode, subMode } = this.state;
    if (pipeline) {
      this.setState({ saveLoading: true });
      updatePipeline({
        alias: pipeline.alias,
        description: pipeline.description,
        name: pipeline.name,
        project: pipeline.project.name,
        spec: {
          steps: steps || [],
          mode: {
            steps: mode,
            subSteps: subMode,
          },
        },
      })
        .then((res) => {
          if (res) {
            Message.success('Pipeline updated successfully');
            this.loadPipeline();
            this.setState({ changed: false });
          }
        })
        .finally(() => {
          this.setState({ saveLoading: false });
        });
    }
  };

  runPipeline = () => {
    const { changed } = this.state;
    if (changed) {
      Message.warning(i18n.t('Please save the changes first.'));
      return;
    }
    this.setState({ showRunPipeline: true });
  };

  render() {
    const {
      pipeline,
      definitions,
      changed,
      saveLoading,
      mode,
      subMode,
      editMode,
      showRunPipeline,
    } = this.state;
    const { dispatch } = this.props;
    const {
      params: { projectName },
    } = this.props.match;

    return (
      <div>
        <Row>
          <Col span={12} className={classNames('breadcrumb')}>
            <Link to={'/'}>
              <Icon type="home" />
            </Link>
            <Breadcrumb separator="/">
              <Breadcrumb.Item>
                <Link to={'/projects/' + projectName}>{projectName}</Link>
              </Breadcrumb.Item>

              <Breadcrumb.Item>
                <Link to={`/projects/${projectName}/pipelines`}>
                  <Translation>Pipelines</Translation>
                </Link>
              </Breadcrumb.Item>

              <Breadcrumb.Item>
                <Link to={`/projects/${projectName}/pipelines/${pipeline?.name || ''}/studio`}>
                  {pipeline && (pipeline.alias || pipeline.name)}
                </Link>
              </Breadcrumb.Item>

              <Breadcrumb.Item>
                <Translation>Studio</Translation>
              </Breadcrumb.Item>
            </Breadcrumb>
          </Col>
          <Col span={12} className="flexright">
            <Button type="primary" onClick={this.runPipeline}>
              <Translation>Run</Translation>
            </Button>
          </Col>
        </Row>
        <div className="run-layout" style={{ marginTop: '16px' }}>
          {changed && (
            <WorkflowPrompt
              changed={changed}
              content="Do you want to save your changes?"
              title={i18n.t('Unsaved changes')}
              onSave={this.onSave}
              dispatch={dispatch}
              onClearChanged={() => {
                this.setState({ changed: false });
              }}
            />
          )}
          <Card contentHeight={'auto'}>
            <Row>
              <Col span={11} />
              <Col span={2}>
                <ButtonGroup>
                  <Button
                    onClick={() => {
                      this.setState({ editMode: 'visual' });
                    }}
                    className={classNames('edit-mode', { active: editMode === 'visual' })}
                  >
                    VISUAL
                  </Button>
                  <Button
                    onClick={() => {
                      this.setState({ editMode: 'yaml' });
                    }}
                    className={classNames('edit-mode', 'two', { active: editMode === 'yaml' })}
                  >
                    YAML
                  </Button>
                </ButtonGroup>
              </Col>
              <Col
                span={11}
                style={{
                  display: 'flex',
                  justifyContent: 'end',
                }}
              >
                {changed && (
                  <div className="notice-changes">
                    <Translation>Unsaved changes</Translation>
                  </div>
                )}
                <Form.Item label="Mode" labelAlign="inset" style={{ marginRight: '8px' }}>
                  <Select
                    locale={locale().Select}
                    defaultValue="StepByStep"
                    value={mode}
                    dataSource={[{ value: 'StepByStep' }, { value: 'DAG' }]}
                    onChange={(value) => {
                      this.setState({ mode: value, changed: this.state.mode !== value });
                    }}
                  />
                </Form.Item>
                <Form.Item label="Sub Mode" labelAlign="inset" style={{ marginRight: '8px' }}>
                  <Select
                    locale={locale().Select}
                    defaultValue="DAG"
                    value={subMode}
                    onChange={(value) => {
                      this.setState({ subMode: value, changed: this.state.subMode !== value });
                    }}
                    dataSource={[{ value: 'DAG' }, { value: 'StepByStep' }]}
                  />
                </Form.Item>
                <Button
                  disabled={!changed}
                  loading={saveLoading}
                  type="primary"
                  onClick={this.onSave}
                >
                  <Translation>Save</Translation>
                </Button>
              </Col>
            </Row>
          </Card>
          {!pipeline && <Loading visible={true} />}
          {pipeline && editMode === 'visual' && (
            <WorkflowContext.Provider
              value={{
                projectName: pipeline?.project?.name,
                workflow: {
                  name: pipeline.name,
                  alias: pipeline.alias,
                  steps: pipeline.spec.steps,
                  mode: pipeline.spec.mode?.steps || 'StepByStep',
                  subMode: pipeline.spec.mode?.subSteps || 'DAG',
                  createTime: pipeline.createTime,
                },
              }}
            >
              <WorkflowStudio
                definitions={definitions}
                steps={_.cloneDeep(pipeline.spec.steps)}
                onChange={this.onChange}
              />
            </WorkflowContext.Provider>
          )}
          {pipeline && editMode === 'yaml' && (
            <WorkflowYAML
              steps={_.cloneDeep(pipeline.spec.steps)}
              name={pipeline.name}
              onChange={this.onChange}
            />
          )}
        </div>
        <If condition={showRunPipeline}>
          {pipeline && (
            <RunPipeline
              onClose={() => {
                this.setState({ showRunPipeline: false });
              }}
              onSuccess={(runName) => {
                this.props.dispatch(
                  routerRedux.push(
                    `/projects/${pipeline.project.name}/pipelines/${pipeline.name}/runs/${runName}`,
                  ),
                );
              }}
              pipeline={pipeline}
            />
          )}
        </If>
      </div>
    );
  }
}

export default PipelineStudio;
