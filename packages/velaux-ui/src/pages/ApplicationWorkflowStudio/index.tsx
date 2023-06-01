import { Balloon, Button, Card, Form, Grid, Loading, Message, Select, Tag, MenuButton } from '@alifd/next';
import { connect } from 'dva';
import _ from 'lodash';
import React from 'react';
import type { Dispatch } from 'redux';

import { detailWorkflow, getWorkflowDefinitions, updateWorkflow } from '../../api/workflows';
import Item from '../../components/Item';
import { Translation } from '../../components/Translation';
import { WorkflowPrompt } from '../../components/WorkflowPrompt';
import WorkflowStudio from '../../components/WorkflowStudio';
import { WorkflowContext } from '../../context';
import type { WorkflowData } from '../../context/index';
import type { ApplicationDetail, EnvBinding, Workflow, WorkflowMode , DefinitionBase , WorkflowStep } from '@velaux/data';
import { showAlias } from '../../utils/common';
import { locale } from '../../utils/locale';

import './index.less';
import classNames from 'classnames';

import { WorkflowYAML } from '../../components/WorkflowYAML';
import i18n from '../../i18n';
import { CanarySetting } from './components/CanarySetting';
import { locationService } from '../../services/LocationService';

const { Row, Col } = Grid;
const ButtonGroup = Button.Group;

type Props = {
  dispatch: Dispatch<any>;
  match: { params: { appName: string; envName: string; workflowName: string } };
  applicationDetail?: ApplicationDetail;
  envbinding: EnvBinding[];
};

type State = {
  workflow?: Workflow;
  definitions?: DefinitionBase[];
  steps?: WorkflowStep[];
  changed: boolean;
  saveLoading?: boolean;
  mode: WorkflowMode;
  subMode: WorkflowMode;
  editMode: 'visual' | 'yaml';
  setCanary?: boolean;
};

export const WorkflowModeOptions = [
  {
    value: 'DAG',
    label: i18n.t('DAG'),
    description: 'Workflows will be executed in parallel in DAG mode based on dependencies.',
  },
  {
    value: 'StepByStep',
    label: i18n.t('StepByStep'),
    description: 'The workflow will be executed serially step by step .',
  },
];

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationWorkflowStudio extends React.Component<Props, State> {
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
    this.loadWorkflow();
    this.loadWorkflowDefinitions();
  }

  componentDidUpdate(prevProps: Readonly<Props>): void {
    if (prevProps.match !== this.props.match || prevProps.envbinding !== this.props.envbinding) {
      this.loadWorkflow();
    }
    const search = locationService.getSearchObject();
    const setCanary = search && search['setCanary'] == true ? true : false;
    if (this.state.setCanary != setCanary) {
      this.setState({ setCanary: setCanary });
    }
  }

  loadWorkflow = () => {
    const {
      params: { appName, workflowName },
    } = this.props.match;
    detailWorkflow({ appName: appName, name: workflowName }).then((res: Workflow) => {
      this.setState({ workflow: res, mode: res.mode, subMode: res.subMode, steps: res.steps });
    });
  };

  loadApplicationWorkflows = async () => {
    const { applicationDetail } = this.props;
    if (applicationDetail) {
      this.props.dispatch({
        type: 'application/getApplicationWorkflows',
        payload: { appName: applicationDetail.name },
      });
    }
  };

  loadWorkflowDefinitions = () => {
    getWorkflowDefinitions('Application').then((res: any) => {
      if (res) {
        this.setState({
          definitions: res && res.definitions,
        });
      }
    });
  };

  getEnvbindingByName = () => {
    const { envbinding } = this.props;
    const {
      params: { envName },
    } = this.props.match;
    return envbinding.find((env) => env.name === envName);
  };

  onChange = (steps: WorkflowStep[]) => {
    const { workflow } = this.state;
    this.setState({ steps: steps, changed: !_.isEqual(steps, workflow?.steps) });
  };

  onSave = () => {
    const { workflow, steps, mode, subMode } = this.state;
    const { applicationDetail } = this.props;
    if (workflow && applicationDetail) {
      this.setState({ saveLoading: true });
      updateWorkflow(
        { appName: applicationDetail.name, workflowName: workflow.name },
        {
          alias: workflow.alias,
          description: workflow.description,
          default: workflow.default,
          mode: mode,
          subMode: subMode,
          steps: steps || [],
        }
      )
        .then((res) => {
          if (res) {
            Message.success(i18n.t('Workflow updated successfully'));
            this.loadWorkflow();
            this.loadApplicationWorkflows();
            this.setState({ changed: false });
          }
        })
        .finally(() => {
          this.setState({ saveLoading: false });
        });
    }
  };

  render() {
    const { workflow, definitions, changed, saveLoading, mode, subMode, editMode, setCanary, steps } = this.state;
    const { applicationDetail, dispatch } = this.props;
    const envbinding = this.getEnvbindingByName();
    return (
      <div className="run-layout">
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
            <Col span={10}>
              <Item
                label={i18n.t('Available Targets')}
                value={
                  <div>
                    {envbinding?.targets?.map((tar) => {
                      return (
                        <Balloon
                          key={tar.name}
                          trigger={
                            <Tag style={{ marginBottom: '4px' }} color="#85d4ff" type="primary">
                              {showAlias(tar.name, tar.alias)}
                            </Tag>
                          }
                        >
                          <p>Cluster: {showAlias(tar.cluster?.clusterName || '', tar.clusterAlias)}</p>
                          <p>Namespace: {tar.cluster?.namespace}</p>
                        </Balloon>
                      );
                    })}
                  </div>
                }
              />
            </Col>
            <Col span={4}>
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
              span={10}
              style={{
                display: 'flex',
                justifyContent: 'end',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: 'end',
                }}
              >
                <MenuButton
                  style={{ marginRight: 'var(--spacing-4)' }}
                  autoWidth={false}
                  label={i18n.t('More').toString()}
                >
                  <MenuButton.Item
                    onClick={() => {
                      locationService.partial({ setCanary: true });
                      this.setState({ setCanary: true });
                    }}
                  >
                    <Translation>Canary Rollout Setting</Translation>
                  </MenuButton.Item>
                </MenuButton>
                <Form.Item label={i18n.t('Mode').toString()} labelAlign="inset" style={{ marginRight: '8px' }}>
                  <Select
                    locale={locale().Select}
                    defaultValue="StepByStep"
                    value={mode}
                    dataSource={WorkflowModeOptions}
                    onChange={(value) => {
                      this.setState({ mode: value, changed: this.state.mode !== value });
                    }}
                  />
                </Form.Item>
                <Form.Item label={i18n.t('Sub Mode').toString()} labelAlign="inset" style={{ marginRight: '8px' }}>
                  <Select
                    locale={locale().Select}
                    defaultValue="DAG"
                    value={subMode}
                    onChange={(value) => {
                      this.setState({ subMode: value, changed: this.state.subMode !== value });
                    }}
                    dataSource={WorkflowModeOptions}
                  />
                </Form.Item>
                <Button disabled={!changed} loading={saveLoading} type="primary" onClick={this.onSave}>
                  <Translation>Save</Translation>
                </Button>
              </div>
              {changed && (
                <div className="notice-changes">
                  <Translation>Unsaved changes</Translation>
                </div>
              )}
            </Col>
          </Row>
        </Card>
        {!workflow && <Loading visible={true} />}
        {workflow && editMode === 'visual' && (
          <WorkflowContext.Provider
            value={{
              appName: applicationDetail?.name,
              projectName: applicationDetail?.project?.name,
              workflow: workflow as WorkflowData,
            }}
          >
            <WorkflowStudio
              subMode={workflow.subMode}
              definitions={definitions}
              steps={steps}
              onChange={this.onChange}
            />
          </WorkflowContext.Provider>
        )}
        {workflow && editMode === 'yaml' && (
          <WorkflowYAML steps={steps} name={workflow.name} onChange={this.onChange} />
        )}

        {setCanary && (
          <CanarySetting
            definitions={definitions}
            onCancel={() => {
              locationService.partial({ setCanary: false });
              this.setState({ setCanary: false });
            }}
            workflow={workflow}
            onChange={this.onChange}
          ></CanarySetting>
        )}
      </div>
    );
  }
}

export default ApplicationWorkflowStudio;
