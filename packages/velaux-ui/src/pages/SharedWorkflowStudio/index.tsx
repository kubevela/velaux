import { Button, Card, Dialog, Grid, Loading, Message } from '@alifd/next';
import classNames from 'classnames';
import { connect } from 'dva';
import { Redirect, routerRedux } from 'dva/router';
import _ from 'lodash';
import React from 'react';
import { AiOutlineSetting } from 'react-icons/ai';
import type { Dispatch } from 'redux';

import type {
  DefinitionBase,
  LoginUserInfo,
  SharedWorkflow,
  SharedWorkflowScope,
  WorkflowMode,
  WorkflowStep,
} from '@velaux/data';
import { createSharedWorkflow, detailSharedWorkflow, updateSharedWorkflow } from '../../api/sharedWorkflows';
import { getWorkflowDefinitions } from '../../api/workflows';
import { Breadcrumb } from '../../components/Breadcrumb';
import { StatusBadge } from '../../components/StatusBadge';
import { Translation } from '../../components/Translation';
import { WorkflowPrompt } from '../../components/WorkflowPrompt';
import WorkflowStudio from '../../components/WorkflowStudio';
import { confirmOrderedSave } from '../../components/WorkflowStudio/confirm';
import { SettingsSummary, WorkflowSettingsPanel } from '../../components/WorkflowStudio/settings';
import { WorkflowYAML } from '../../components/WorkflowYAML';
import { WorkflowContext } from '../../context';
import i18n from '../../i18n';
import { locale } from '../../utils/locale';
import type { SharedWorkflowDraft } from '../SharedWorkflows/draft';
import { canChange, studioPath } from '../SharedWorkflows/draft';

const { Row, Col } = Grid;
const ButtonGroup = Button.Group;

type Props = {
  dispatch: Dispatch<any>;
  match: { params: { scope?: SharedWorkflowScope; name?: string } };
  location: { search: string; state?: SharedWorkflowDraft };
  currentProject?: { current: string; resolved: boolean };
  userInfo?: LoginUserInfo;
};

type State = {
  // shared is the saved workflow; none while it is a draft.
  shared?: SharedWorkflow;
  loading: boolean;
  definitions?: DefinitionBase[];
  steps: WorkflowStep[];
  mode: WorkflowMode;
  subMode: WorkflowMode;
  alias?: string;
  description?: string;
  changed: boolean;
  saving?: boolean;
  editMode: 'visual' | 'yaml';
  showSettings?: boolean;
};

// SharedWorkflowStudio edits a shared workflow, or creates one from a draft,
// with the studio application workflows use. Who may not change it sees it
// read-only.
class SharedWorkflowStudio extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const draft = this.draft();
    this.state = {
      loading: !draft,
      steps: draft?.steps || [],
      mode: draft?.mode || 'StepByStep',
      subMode: draft?.subMode || 'DAG',
      alias: draft?.alias,
      description: draft?.description,
      // A draft is unsaved from the start.
      changed: !!draft,
      editMode: 'visual',
    };
  }

  componentDidMount() {
    const draft = this.draft();
    if (draft) {
      this.loadDefinitions(draft.scope === 'project' ? draft.namespace : undefined);
    } else {
      this.load();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.match !== this.props.match && !this.draft()) {
      this.load();
    }
  }

  // draft is the workflow being created, on the new route only.
  draft = (): SharedWorkflowDraft | undefined =>
    this.props.match.params.scope ? undefined : this.props.location.state;

  // project is the one the workflow is shown for: the link's, else the picked.
  project = () =>
    new URLSearchParams(this.props.location.search).get('project') ||
    this.draft()?.project ||
    this.props.currentProject?.current ||
    '';

  scope = (): SharedWorkflowScope => this.draft()?.scope || this.props.match.params.scope || 'project';

  name = () => this.draft()?.name || this.props.match.params.name || '';

  load = () => {
    const { scope, name } = this.props.match.params;
    if (!scope || !name) {
      return;
    }
    this.setState({ loading: true });
    detailSharedWorkflow(this.project(), scope, name)
      .then((res: SharedWorkflow) => {
        if (res) {
          this.setState({
            shared: res,
            steps: res.steps,
            mode: res.mode || 'StepByStep',
            subMode: res.subMode || 'DAG',
            alias: res.alias,
            description: res.description,
            changed: false,
          });
          this.loadDefinitions(scope === 'project' ? res.namespace : undefined);
        }
      })
      .finally(() => this.setState({ loading: false }));
  };

  // loadDefinitions offers the step types allowed where the workflow lives; a
  // global one runs in any namespace, so it is offered every type.
  loadDefinitions = (namespace?: string) => {
    getWorkflowDefinitions('Application', namespace ? [namespace] : undefined).then((res: any) => {
      if (res) {
        this.setState({ definitions: res.definitions });
      }
    });
  };

  readOnly = () => !canChange(this.project(), this.scope(), this.props.userInfo);

  onChange = (steps: WorkflowStep[]) => {
    this.setState({ steps, changed: !!this.draft() || !_.isEqual(steps, this.state.shared?.steps) });
  };

  save = () => {
    const { steps, mode, subMode, alias, description } = this.state;
    const project = this.project();
    const scope = this.scope();
    const name = this.name();
    const body = { name, alias, description, mode, subMode, steps };
    this.setState({ saving: true });
    const request = this.draft()
      ? createSharedWorkflow(project, scope, body)
      : updateSharedWorkflow(project, scope, name, body);
    request
      .then((res: any) => {
        if (!res) {
          return;
        }
        Message.success(i18n.t('Shared workflow saved').toString());
        this.setState({ changed: false });
        if (this.draft()) {
          this.props.dispatch(routerRedux.replace(studioPath(project, scope, name)));
        } else {
          this.load();
        }
      })
      .finally(() => this.setState({ saving: false }));
  };

  // confirmUsed saves, after saying which workflows will run the change.
  confirmUsed = () => {
    const used = this.state.shared?.usedBy?.length || 0;
    const elsewhere = this.state.shared?.usedElsewhere || 0;
    if (used + elsewhere === 0) {
      this.save();
      return;
    }
    Dialog.confirm({
      type: 'confirm',
      title: i18n.t('This shared workflow is in use').toString(),
      content: (
        <div>
          <p>
            {used > 0 &&
              `${used} ${i18n.t(used === 1 ? 'workflow in this project' : 'workflows in this project').toString()}`}
            {used > 0 && elsewhere > 0 && ` ${i18n.t('and').toString()} `}
            {elsewhere > 0 && `${elsewhere} ${i18n.t('in other projects').toString()}`}{' '}
            {i18n.t('run it. Their next run uses the change.').toString()}
          </p>
          <p>{i18n.t('Save anyway?').toString()}</p>
        </div>
      ),
      onOk: this.save,
      locale: locale().Dialog,
    });
  };

  render() {
    const draft = this.draft();
    if (!this.props.match.params.scope && !draft) {
      // A draft lives only in the page that opened it.
      return <Redirect to="/shared-workflows" />;
    }
    const { shared, loading, definitions, steps, mode, subMode, changed, saving, editMode } = this.state;
    const scope = this.scope();
    const name = this.name();
    const readOnly = this.readOnly();
    const title = this.state.alias || name;
    return (
      <div>
        <Row>
          <Col span={24} className="breadcrumb">
            <Breadcrumb
              items={[
                { to: '/shared-workflows', title: i18n.t('Workflows').toString() },
                { title: title },
                { title: draft ? i18n.t('New').toString() : 'Studio' },
              ]}
            />
          </Col>
        </Row>
        <div className="run-layout" style={{ marginTop: '16px' }}>
          {changed && !readOnly && (
            <WorkflowPrompt
              changed={changed}
              content="Do you want to save your changes?"
              title={i18n.t('Unsaved changes')}
              onSave={this.confirmUsed}
              dispatch={this.props.dispatch}
              onClearChanged={() => this.setState({ changed: false })}
            />
          )}
          <Card contentHeight="auto">
            <Row>
              <Col span={10} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StatusBadge
                  tone={scope === 'global' ? 'neutral' : 'progressing'}
                  label={scope === 'global' ? 'Global' : 'Project'}
                />
                {shared && (
                  <span className="row-list-muted">
                    {(shared.usedBy?.length || 0) + (shared.usedElsewhere || 0) > 0
                      ? `${i18n.t('Used by').toString()} ${
                          (shared.usedBy?.length || 0) + (shared.usedElsewhere || 0)
                        } ${i18n.t('workflows').toString()}`
                      : i18n.t('Not used').toString()}
                  </span>
                )}
                {readOnly && (
                  <span className="row-list-muted">
                    <Translation>
                      {scope === 'global' ? 'Read-only, as only admins change global shared workflows' : 'Read-only'}
                    </Translation>
                  </span>
                )}
              </Col>
              <Col span={4}>
                <ButtonGroup>
                  <Button
                    onClick={() => this.setState({ editMode: 'visual' })}
                    className={classNames('edit-mode', { active: editMode === 'visual' })}
                  >
                    VISUAL
                  </Button>
                  <Button
                    disabled={readOnly}
                    onClick={() => this.setState({ editMode: 'yaml' })}
                    className={classNames('edit-mode', 'two', { active: editMode === 'yaml' })}
                  >
                    YAML
                  </Button>
                </ButtonGroup>
              </Col>
              <Col span={10} style={{ display: 'flex', justifyContent: 'end' }}>
                {changed && !readOnly && (
                  <div className="notice-changes">
                    <Translation>{draft ? 'Not saved yet' : 'Unsaved changes'}</Translation>
                  </div>
                )}
                <Button
                  className="studio-settings-button"
                  style={{ marginRight: '8px' }}
                  onClick={() => this.setState({ showSettings: true })}
                >
                  <AiOutlineSetting />
                  <Translation>Settings</Translation>
                  <SettingsSummary mode={mode} subMode={subMode} />
                </Button>
                {!readOnly && (
                  <Button
                    disabled={!changed}
                    loading={saving}
                    type="primary"
                    onClick={() => confirmOrderedSave(steps, mode, subMode, this.confirmUsed)}
                  >
                    <Translation>{draft ? 'Create' : 'Save'}</Translation>
                  </Button>
                )}
              </Col>
            </Row>
          </Card>
          <Loading visible={loading} style={{ width: '100%' }}>
            {(shared || draft) && editMode === 'visual' && (
              <WorkflowContext.Provider
                value={{
                  projectName: this.project(),
                  workflow: { name, alias: this.state.alias, steps, mode, subMode },
                }}
              >
                <WorkflowStudio
                  mode={mode}
                  subMode={subMode}
                  definitions={definitions}
                  steps={steps}
                  readOnly={readOnly}
                  onChange={this.onChange}
                />
              </WorkflowContext.Provider>
            )}
            {(shared || draft) && editMode === 'yaml' && (
              <WorkflowYAML steps={_.cloneDeep(steps)} name={name} onChange={this.onChange} />
            )}
          </Loading>
          {this.state.showSettings && (
            <WorkflowSettingsPanel
              settings={{ name, alias: this.state.alias, description: this.state.description, mode, subMode }}
              onClose={() => this.setState({ showSettings: false })}
              onApply={(settings) =>
                readOnly
                  ? this.setState({ showSettings: false })
                  : this.setState({
                      alias: settings.alias,
                      description: settings.description,
                      mode: (settings.mode || 'StepByStep') as WorkflowMode,
                      subMode: (settings.subMode || 'DAG') as WorkflowMode,
                      showSettings: false,
                      changed: true,
                    })
              }
            />
          )}
        </div>
      </div>
    );
  }
}

export default connect((store: any) => ({ currentProject: store.currentProject, userInfo: store.user?.userInfo }))(
  SharedWorkflowStudio
);
