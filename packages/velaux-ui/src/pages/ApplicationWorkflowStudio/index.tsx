import { Balloon, Button, Card, Grid, Loading, Message, Tag, MenuButton } from '@alifd/next';
import { connect } from 'dva';
import { Link } from 'dva/router';
import _ from 'lodash';
import React from 'react';
import type { Dispatch } from 'redux';

import { detailWorkflow, getWorkflowDefinitions, listSharedWorkflows, updateWorkflow } from '../../api/workflows';
import Item from '../../components/Item';
import { Translation } from '../../components/Translation';
import { WorkflowPrompt } from '../../components/WorkflowPrompt';
import WorkflowStudio from '../../components/WorkflowStudio';
import { confirmOrderedSave } from '../../components/WorkflowStudio/confirm';
import { SettingsSummary, WorkflowSettingsPanel } from '../../components/WorkflowStudio/settings';
import { AiOutlineSetting } from 'react-icons/ai';
import { WorkflowContext } from '../../context';
import type { WorkflowData } from '../../context/index';
import { deployNamespaces } from '../../utils/restrictions';
import type {
  ApplicationDetail,
  EnvBinding,
  Workflow,
  WorkflowMode,
  DefinitionBase,
  SharedWorkflow,
  SharedWorkflowScope,
  WorkflowStep,
} from '@velaux/data';
import { showAlias } from '../../utils/common';

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
  // mode and subMode are empty where a referenced workflow follows the shared
  // one's, sharedMode and sharedSubMode.
  mode: WorkflowMode | '';
  subMode: WorkflowMode | '';
  ref?: string;
  sharedScope?: SharedWorkflowScope;
  sharedMode?: WorkflowMode;
  sharedSubMode?: WorkflowMode;
  editMode: 'visual' | 'yaml';
  setCanary?: boolean;
  // alias, description and isDefault are the workflow's own fields as edited.
  alias?: string;
  description?: string;
  isDefault?: boolean;
  showSettings?: boolean;
};

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
      this.loadWorkflowDefinitions();
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
      this.setState({
        workflow: res,
        mode: res.mode,
        subMode: res.subMode,
        steps: res.steps,
        alias: res.alias,
        description: res.description,
        isDefault: res.default,
        ref: res.ref,
        sharedScope: res.sharedScope,
        sharedMode: res.sharedMode,
        sharedSubMode: res.sharedSubMode,
      });
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

  // definitionsRequest numbers the step definition requests, so only the latest
  // may set the list: an earlier one asked about other namespaces.
  definitionsRequest = 0;

  loadWorkflowDefinitions = () => {
    const namespaces = deployNamespaces(this.deployTargets());
    const request = ++this.definitionsRequest;
    // Until the environment loads there is no namespace to check restrictions
    // against, and an unfiltered list offers steps the webhook then refuses.
    if (namespaces.length === 0) {
      this.setState({ definitions: [] });
      return;
    }
    getWorkflowDefinitions('Application', namespaces).then((res: any) => {
      if (res && request === this.definitionsRequest) {
        this.setState({
          definitions: res && res.definitions,
        });
      }
    });
  };

  // deployTargets is the environment this workflow deploys to, where its step
  // types' restrictions are checked; the studio lists only the usable ones.
  deployTargets = (): EnvBinding[] => {
    const env = this.getEnvbindingByName();
    return env ? [env] : [];
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
    const { workflow, steps, mode, subMode, alias, description, isDefault, ref } = this.state;
    const { applicationDetail } = this.props;
    if (workflow && applicationDetail) {
      this.setState({ saveLoading: true });
      updateWorkflow(
        { appName: applicationDetail.name, workflowName: workflow.name },
        {
          alias: alias,
          description: description,
          default: isDefault,
          mode: mode,
          subMode: subMode,
          ref: ref,
          steps: ref ? [] : steps || [],
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

  // effectiveModes are how the steps run: as set, else as the shared workflow
  // sets them, else KubeVela's defaults.
  effectiveModes = (): [WorkflowMode, WorkflowMode] => {
    const { mode, subMode, sharedMode, sharedSubMode } = this.state;
    return [mode || sharedMode || 'StepByStep', subMode || sharedSubMode || 'DAG'];
  };

  // useCopy stops referencing the shared workflow, keeping its steps and modes
  // as this workflow's own, to edit.
  useCopy = () => {
    const [mode, subMode] = this.effectiveModes();
    this.setState({
      ref: undefined,
      sharedScope: undefined,
      sharedMode: undefined,
      sharedSubMode: undefined,
      mode,
      subMode,
      changed: true,
    });
  };

  render() {
    const { workflow, definitions, changed, saveLoading, mode, subMode, editMode, setCanary, steps, ref } = this.state;
    const [runMode, runSubMode] = this.effectiveModes();
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
                  disabled={!!ref}
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
                <Button
                  className="studio-settings-button"
                  style={{ marginRight: '8px' }}
                  onClick={() => this.setState({ showSettings: true })}
                >
                  <AiOutlineSetting />
                  <Translation>Settings</Translation>
                  <SettingsSummary mode={runMode} subMode={runSubMode} shared={ref} scope={this.state.sharedScope} />
                </Button>
                <Button
                  disabled={!changed}
                  loading={saveLoading}
                  type="primary"
                  onClick={() => confirmOrderedSave(this.state.steps || [], runMode, runSubMode, this.onSave)}
                >
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
            {ref && (
              <div className="studio-shared-banner">
                <span>
                  <Translation>
                    {this.state.sharedScope === 'global'
                      ? 'Steps come from the global shared workflow'
                      : this.state.sharedScope === 'project'
                      ? "Steps come from the project's shared workflow"
                      : 'Steps come from the shared workflow'}
                  </Translation>{' '}
                  <code>{ref}</code>.{' '}
                  {this.state.sharedScope === 'global' || this.state.sharedScope === 'project' ? (
                    <Link
                      to={`/shared-workflows/${this.state.sharedScope}/${ref}?project=${
                        applicationDetail?.project?.name || ''
                      }`}
                    >
                      <Translation>Change them there</Translation>
                    </Link>
                  ) : (
                    <Translation>Change them there</Translation>
                  )}
                  , <Translation>or</Translation>
                </span>
                <Button text type="primary" onClick={this.useCopy}>
                  <Translation>use a copy instead</Translation>
                </Button>
              </div>
            )}
            <WorkflowStudio
              mode={runMode}
              subMode={runSubMode}
              definitions={definitions}
              steps={steps}
              readOnly={!!ref}
              onChange={this.onChange}
            />
          </WorkflowContext.Provider>
        )}
        {workflow && this.state.showSettings && (
          <WorkflowSettingsPanel
            withDefault
            settings={{
              name: workflow.name,
              alias: this.state.alias,
              description: this.state.description,
              mode,
              subMode,
              default: this.state.isDefault,
              ref,
            }}
            loadShared={() =>
              listSharedWorkflows({ appName: applicationDetail?.name || '', workflowName: workflow.name }).then(
                (res: { workflows?: SharedWorkflow[]; globalUnavailable?: boolean }) => ({
                  workflows: res?.workflows || [],
                  globalUnavailable: !!res?.globalUnavailable,
                })
              )
            }
            onClose={() => this.setState({ showSettings: false })}
            onApply={(settings, shared) =>
              this.setState({
                alias: settings.alias,
                description: settings.description,
                isDefault: settings.default,
                mode: settings.mode,
                subMode: settings.subMode,
                ref: settings.ref,
                // A shared workflow's steps are shown, not edited; leaving one
                // keeps its steps as this workflow's own.
                steps: settings.ref ? shared?.steps || [] : steps,
                sharedScope: settings.ref ? shared?.scope : undefined,
                sharedMode: settings.ref ? shared?.mode : undefined,
                sharedSubMode: settings.ref ? shared?.subMode : undefined,
                editMode: settings.ref ? 'visual' : editMode,
                showSettings: false,
                changed: true,
              })
            }
          />
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
